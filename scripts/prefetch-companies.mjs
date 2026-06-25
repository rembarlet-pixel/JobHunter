/**
 * Récupère les entreprises cibles depuis l'API Sirène INSEE
 * Secteurs : BTP industrie (béton/ciment/métal), négoce matériaux, génie civil
 * Périmètre : Auvergne-Rhône-Alpes + Grand Est
 * Taille minimale : 20 salariés (tranche >= 12)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIRENE_API_KEY = process.env.SIRENE_API_KEY;
if (!SIRENE_API_KEY) {
  console.error('❌ SIRENE_API_KEY manquante');
  process.exit(1);
}

// Codes APE ciblés pour le profil de JC
const CODES_APE = [
  '2351Z', // Fabrication de ciment
  '2352Z', // Fabrication de chaux et plâtre
  '2361Z', // Éléments en béton pour construction
  '2363Z', // Béton prêt à l'emploi
  '2364Z', // Mortiers et bétons secs
  '2369Z', // Ouvrages en béton/ciment/plâtre
  '2410Z', // Sidérurgie
  '2420Z', // Tubes et tuyaux en acier
  '2511Z', // Structures métalliques
  '2521Z', // Radiateurs et chaudières
  '2529Z', // Réservoirs et citernes métal
  '2561Z', // Traitement des métaux
  '2593Z', // Articles en fils métalliques
  '2814Z', // Robinets et vannes
  '4672Z', // Commerce gros minerais/métaux
  '4673Z', // Commerce gros matériaux construction
  '4674Z', // Commerce gros quincaillerie/plomberie
  '4211Z', // Construction routes et autoroutes
  '4221Z', // Construction réseaux fluides
  '4299Z', // Construction génie civil
];

// Départements AURA + Grand Est
const DEPARTEMENTS = [
  // Auvergne-Rhône-Alpes
  '01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74',
  // Grand Est
  '08', '10', '51', '52', '54', '55', '57', '67', '68', '88',
];

const GEOCODE_API = 'https://api-adresse.data.gouv.fr/search/csv/';

async function fetchPage(codeApe, page, nbResultats = 500) {
  const q = encodeURIComponent(
    `activitePrincipaleEtablissement:${codeApe} AND etatAdministratifEtablissement:A`
  );
  const deptFilter = DEPARTEMENTS.map(d => `codePostalEtablissement:${d}*`).join(' OR ');
  const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret?q=${q} AND (${encodeURIComponent(deptFilter)})&nombre=${nbResultats}&debut=${page * nbResultats}&champs=siret,siren,denominationUniteLegale,nomUniteLegale,prenomUsuelUniteLegale,activitePrincipaleEtablissement,libelleActivitePrincipaleEtablissement,trancheEffectifsUniteLegale,dateCreationEtablissement,adresseEtablissement`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SIRENE_API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sirène ${res.status}: ${err.slice(0, 200)}`);
  }

  return res.json();
}

async function geocodeBatch(adresses) {
  if (adresses.length === 0) return [];

  const lines = ['adresse,codepostal,id'];
  adresses.forEach(a => {
    const safe = (s) => (s || '').replace(/"/g, '').replace(/,/g, ' ');
    lines.push(`"${safe(a.adresse)}","${safe(a.codePostal)}","${a.id}"`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const fd = new FormData();
  fd.append('data', blob, 'adresses.csv');
  fd.append('columns', 'adresse');
  fd.append('citycode', 'codepostal');
  fd.append('result_columns', 'result_latitude,result_longitude,result_score');

  const res = await fetch(GEOCODE_API, { method: 'POST', body: fd });
  if (!res.ok) return [];

  const text = await res.text();
  const rows = text.trim().split('\n').slice(1);
  return rows.map(row => {
    const cols = row.split(',');
    const last = cols.length;
    return {
      id: cols[3]?.replace(/"/g, ''),
      lat: parseFloat(cols[last - 3]) || null,
      lng: parseFloat(cols[last - 2]) || null,
      score: parseFloat(cols[last - 1]) || 0,
    };
  });
}

function parseEntreprise(etab) {
  const ul = etab.uniteLegale || {};
  const adr = etab.adresseEtablissement || {};

  const nom = ul.denominationUniteLegale ||
    [ul.prenomUsuelUniteLegale, ul.nomUniteLegale].filter(Boolean).join(' ') ||
    'Entreprise inconnue';

  const numVoie = adr.numeroVoieEtablissement || '';
  const typeVoie = adr.typeVoieEtablissement || '';
  const libelleVoie = adr.libelleVoieEtablissement || '';
  const adresse = [numVoie, typeVoie, libelleVoie].filter(Boolean).join(' ');
  const codePostal = adr.codePostalEtablissement || '';
  const ville = adr.libelleCommuneEtablissement || '';
  const departement = codePostal.slice(0, 2);

  const tranche = ul.trancheEffectifsUniteLegale || '';
  // Filtrer les très petites structures (tranche < 12 = moins de 20 salariés)
  const TRANCHES_EXCLUES = ['00', '01', '02', '03', '11', 'NN', ''];
  if (TRANCHES_EXCLUES.includes(tranche)) return null;

  if (!DEPARTEMENTS.includes(departement)) return null;

  return {
    id: etab.siret,
    siret: etab.siret,
    siren: etab.siren,
    nom,
    adresse,
    codePostal,
    ville,
    departement,
    codeApe: etab.activitePrincipaleEtablissement || '',
    libelleApe: etab.libelleActivitePrincipaleEtablissement || '',
    trancheEffectifs: tranche,
    dateCreation: etab.dateCreationEtablissement || '',
    lat: null,
    lng: null,
  };
}

async function main() {
  console.log('🦸 Job Hunter — Prefetch entreprises Sirène');
  console.log(`Codes APE : ${CODES_APE.length} | Départements : ${DEPARTEMENTS.length}`);

  const entreprises = new Map();

  for (const code of CODES_APE) {
    console.log(`\n  → ${code}...`);
    let page = 0;
    let total = Infinity;

    while (page * 500 < total) {
      try {
        const data = await fetchPage(code, page);
        total = Math.min(data.header?.total || 0, 5000);

        for (const etab of data.etablissements || []) {
          const e = parseEntreprise(etab);
          if (e && !entreprises.has(e.id)) {
            entreprises.set(e.id, e);
          }
        }

        console.log(`    page ${page + 1} — ${data.etablissements?.length || 0} établissements (total API: ${data.header?.total || 0})`);
        page++;

        if ((data.etablissements?.length || 0) === 0) break;
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.warn(`    ⚠️ Erreur page ${page}: ${err.message}`);
        break;
      }
    }
  }

  const list = [...entreprises.values()];
  console.log(`\n✅ ${list.length} entreprises uniques avant géocodage`);

  // Géocodage par batch de 200
  const aGeocoder = list.filter(e => e.adresse && e.codePostal);
  console.log(`🗺️  Géocodage de ${aGeocoder.length} adresses...`);

  const BATCH = 200;
  for (let i = 0; i < aGeocoder.length; i += BATCH) {
    const batch = aGeocoder.slice(i, i + BATCH);
    const results = await geocodeBatch(batch);

    for (const r of results) {
      if (r.id && r.lat && r.lng && r.score > 0.4) {
        const e = entreprises.get(r.id);
        if (e) {
          e.lat = r.lat;
          e.lng = r.lng;
        }
      }
    }

    console.log(`  batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(aGeocoder.length / BATCH)} géocodé`);
    await new Promise(r => setTimeout(r, 300));
  }

  const avecCoords = [...entreprises.values()].filter(e => e.lat && e.lng);
  console.log(`📍 ${avecCoords.length} entreprises géocodées`);

  const outPath = path.join(__dirname, '../data/companies-cache.json');
  fs.writeFileSync(outPath, JSON.stringify([...entreprises.values()], null, 2));
  console.log(`\n💾 Cache écrit → data/companies-cache.json (${entreprises.size} entrées)`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
