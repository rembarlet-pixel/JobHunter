import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

let tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) return tokenCache.token;

  const res = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      scope: 'api_offresdemploiv2 o2dsoffre',
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Auth France Travail ${res.status}: ${data.error} — ${data.error_description}`);
  tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.token;
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: 'Credentials France Travail non configurés' }, { status: 503 });
  }

  try {
    const token = await getToken();

    // Recherche : responsable commercial / chef des ventes / BTP, périmètre AURA + Grand Est
    const params = new URLSearchParams({
      motsCles: 'responsable commercial prescription BTP',
      codeRegion: '84', // Auvergne-Rhône-Alpes (on fait une 2e requête pour Grand Est)
      typeContrat: 'CDI,CDD',
      experienceExigee: 'E', // expérience exigée
      range: '0-29',
      sort: '1', // tri par date
    });

    const [res1, res2] = await Promise.all([
      fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }),
      fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${new URLSearchParams({ ...Object.fromEntries(params), codeRegion: '44' })}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }),
    ]);

    const [data1, data2] = await Promise.all([
      res1.ok ? res1.json() : { resultats: [] },
      res2.ok ? res2.json() : { resultats: [] },
    ]);

    const resultats = [
      ...(data1.resultats || []),
      ...(data2.resultats || []),
    ];

    // Déduplique
    const seen = new Set<string>();
    const uniques = resultats.filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });

    return NextResponse.json({ resultats: uniques, total: uniques.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
