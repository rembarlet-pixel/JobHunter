/**
 * Récupère les entreprises cibles depuis l'API Recherche d'entreprises (api.gouv.fr)
 * API publique, sans clé, accessible depuis Netlify.
 * Coordonnées GPS incluses dans la réponse — pas de géocodage séparé.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://recherche-entreprises.api.gouv.fr/search';

const CODES_APE = [
  '23.51Z', '23.52Z', '23.61Z', '23.63Z', '23.64Z', '23.69Z',
  '24.10Z', '24.20Z',
  '25.11Z', '25.21Z', '25.29Z', '25.61Z', '25.93Z',
  '28.14Z',
  '46.72Z', '46.73Z', '46.74Z',
  '42.11Z', '42.21Z', '42.99Z',
];

// 84 = Auvergne-Rhône-Alpes, 44 = Grand Est
const REGIONS = ['84', '44'];

async function fetchPage(codeApe, region, page) {
  const params = new URLSearchParams({
    activite_principale: codeApe,
    region,
    categorie_entreprise: 'PME,ETI,GE',
    per_page: '25',
    page: String(page),
  });

  const res = await fetch(`${BASE}?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

const TRANCHES_EXCLUES = new Set([null, undefined, '', 'NN', '00', '01', '02', '03']);

function parseEntreprise(r) {
  const siege = r.siege || {};
  const tranche = r.tranche_effectif_salarie ?? null;

  // Exclure les entreprises sans effectifs déclarés ou moins de 10 salariés
  if (TRANCHES_EXCLUES.has(tranche)) return null;

  const nom = r.nom_complet || r.nom_raison_sociale || 'Entreprise inconnue';
  const codePostal = siege.code_postal || '';
  const departement = siege.departement || codePostal.slice(0, 2);

  return {
    id: siege.siret || r.siren,
    siret: siege.siret || '',
    siren: r.siren || '',
    nom,
    adresse: siege.adresse || '',
    codePostal,
    ville: siege.commune || siege.libelle_commune || '',
    departement,
    codeApe: r.activite_principale || '',
    libelleApe: r.libelle_activite_principale || '',
    trancheEffectifs: r.tranche_effectif_salarie || '',
    dateCreation: r.date_creation || '',
    lat: siege.latitude ? parseFloat(siege.latitude) : null,
    lng: siege.longitude ? parseFloat(siege.longitude) : null,
  };
}

async function main() {
  console.log('🦸 Job Hunter — Prefetch entreprises (API Recherche Entreprises)');
  console.log(`Codes APE : ${CODES_APE.length} | Régions : ${REGIONS.join(', ')}`);

  const entreprises = new Map();

  for (const code of CODES_APE) {
    for (const region of REGIONS) {
      let page = 1;
      let total = Infinity;

      while ((page - 1) * 25 < total && page <= 40) {
        try {
          const data = await fetchPage(code, region, page);
          total = data.total_results ?? 0;

          for (const r of data.results || []) {
            if (r.etat_administratif !== 'A') continue;
            const e = parseEntreprise(r);
            if (e && e.id && !entreprises.has(e.id)) {
              entreprises.set(e.id, e);
            }
          }

          if (page === 1) {
            console.log(`  ${code} région ${region} — ${total} résultats`);
          }

          page++;
          if ((data.results || []).length === 0) break;
          await new Promise(r => setTimeout(r, 400));
        } catch (err) {
          console.warn(`  ⚠️ ${code} région ${region} page ${page}: ${err.message}`);
          break;
        }
      }
    }
  }

  const list = [...entreprises.values()];
  const avecCoords = list.filter(e => e.lat && e.lng);

  console.log(`\n✅ ${list.length} entreprises uniques`);
  console.log(`📍 ${avecCoords.length} avec coordonnées GPS`);

  const outPath = path.join(__dirname, '../data/companies-cache.json');
  fs.writeFileSync(outPath, JSON.stringify(list, null, 2));
  console.log(`💾 Cache écrit → data/companies-cache.json`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
