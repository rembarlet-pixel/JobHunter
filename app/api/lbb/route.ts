import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

// Codes ROME : commercial grands comptes + management force de vente + stratégie commerciale
const ROME_CODES = 'D1402,D1401,M1707';

async function getToken(): Promise<string> {
  const body = [
    'grant_type=client_credentials',
    `client_id=${encodeURIComponent(CLIENT_ID!)}`,
    `client_secret=${encodeURIComponent(CLIENT_SECRET!)}`,
    `scope=${encodeURIComponent('api_labonneboitev2 offresdemploimobilite')}`,
  ].join('&');

  const res = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth LBB: ${data.error} — ${data.error_description || ''}`);
  return data.access_token;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompany(c: any) {
  return {
    siret: c.siret || '',
    name: c.name || c.company_name || '',
    city: c.city || c.commune || '',
    // L'API peut retourner latitude/longitude ou lat/lon selon les versions
    lat: c.latitude ?? c.lat ?? null,
    lon: c.longitude ?? c.lon ?? null,
    naf_text: c.naf_text || c.naf || '',
    // stars peut être un objet { total, alternance } ou un nombre
    stars: typeof c.stars === 'object' ? (c.stars?.total ?? 0) : (c.stars ?? 0),
  };
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ companies: [], error: 'Credentials manquants' }, { status: 503 });
  }

  try {
    const token = await getToken();

    const zones = [
      { lat: 45.75, lng: 4.83, dist: 200 }, // Lyon — couvre AURA Est
      { lat: 48.57, lng: 7.75, dist: 160 }, // Strasbourg — couvre Grand Est
    ];

    const results = await Promise.all(zones.map(z =>
      fetch(`https://api.francetravail.io/partenaire/labonneboite/v2/company/?rome_codes=${ROME_CODES}&latitude=${z.lat}&longitude=${z.lng}&distance=${z.dist}&sort=score&page_size=50`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
        .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(`LBB ${r.status}: ${t.slice(0, 100)}`); }))
        .catch(err => ({ companies: [], _error: String(err) }))
    ));

    const seen = new Set<string>();
    const companies = results
      .flatMap(d => (d.companies || []))
      .map(normalizeCompany)
      .filter(c => {
        if (!c.siret || seen.has(c.siret)) return false;
        if (!c.lat || !c.lon) return false;
        seen.add(c.siret);
        return true;
      });

    const errors = results.map(d => d._error).filter(Boolean);

    return NextResponse.json({ companies, count: companies.length, errors });
  } catch (err) {
    return NextResponse.json({ companies: [], error: String(err) }, { status: 500 });
  }
}
