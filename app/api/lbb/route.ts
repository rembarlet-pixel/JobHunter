import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

// Codes ROME : commercial grands comptes + management force de vente
const ROME_CODES = 'D1402,D1401';

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
  if (!res.ok) throw new Error(`Auth LBB: ${data.error}`);
  return data.access_token;
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ companies: [] }, { status: 503 });
  }

  try {
    const token = await getToken();

    const zones = [
      { lat: 45.75, lng: 4.83, dist: 200, label: 'Lyon/AURA' },
      { lat: 48.57, lng: 7.75, dist: 150, label: 'Strasbourg/GrandEst' },
    ];

    const results = await Promise.all(zones.map(z =>
      fetch(`https://api.francetravail.io/partenaire/labonneboite/v2/company/?rome_codes=${ROME_CODES}&latitude=${z.lat}&longitude=${z.lng}&distance=${z.dist}&sort=score&page_size=50`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).then(r => r.ok ? r.json() : { companies: [] }).catch(() => ({ companies: [] }))
    ));

    const seen = new Set<string>();
    const companies = results.flatMap(d => (d.companies || [])).filter((c: { siret: string }) => {
      if (seen.has(c.siret)) return false;
      seen.add(c.siret);
      return true;
    });

    return NextResponse.json({ companies });
  } catch (err) {
    return NextResponse.json({ error: String(err), companies: [] }, { status: 500 });
  }
}
