'use client';

const SITES = [
  {
    nom: 'Indeed',
    emoji: '🔍',
    desc: 'Le plus grand moteur d\'offres d\'emploi',
    couleur: '#2164F3',
    url: 'https://fr.indeed.com/emplois?q=responsable+commercial+BTP+materiaux&l=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'LinkedIn',
    emoji: '💼',
    desc: 'Réseau pro + offres de cadres',
    couleur: '#0A66C2',
    url: 'https://www.linkedin.com/jobs/search/?keywords=responsable%20commercial%20BTP&location=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'APEC',
    emoji: '🎯',
    desc: 'Offres cadres uniquement',
    couleur: '#00A550',
    url: 'https://www.apec.fr/candidat/recherche-emploi.html/emploi?keywords=responsable+commercial+BTP+materiaux&location=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'France Travail',
    emoji: '🏢',
    desc: 'Toutes les offres publiées',
    couleur: '#E2001A',
    url: 'https://candidat.francetravail.fr/offres/recherche?motsCles=responsable+commercial+BTP&lieuTravail=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'Cadremploi',
    emoji: '📊',
    desc: 'Spécialisé profils cadres',
    couleur: '#FF6600',
    url: 'https://www.cadremploi.fr/emploi/liste_offres.html?kw=responsable+commercial+BTP&lieuTravail=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'Monster',
    emoji: '👾',
    desc: 'Large spectre d\'offres',
    couleur: '#6E00FF',
    url: 'https://www.monster.fr/offres-emploi/recherche/?q=responsable-commercial-btp&where=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'HelloWork',
    emoji: '👋',
    desc: 'Spécialisé régions françaises',
    couleur: '#00B0A7',
    url: 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=responsable+commercial+btp&l=Auvergne-Rh%C3%B4ne-Alpes',
  },
  {
    nom: 'Indeed — Grand Est',
    emoji: '🔍',
    desc: 'Même recherche sur Grand Est',
    couleur: '#2164F3',
    url: 'https://fr.indeed.com/emplois?q=responsable+commercial+BTP+materiaux&l=Grand+Est',
  },
];

export default function OffresEmploi() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--sm-bg)', overflowY: 'auto' }}>

      <div style={{
        background: 'var(--sm-panel)', borderBottom: '2px solid var(--sm-red)',
        padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--sm-gold)', fontSize: '1rem' }}>📋 SITES D'EMPLOI</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginTop: 2 }}>
          Responsable commercial / BTP / Matériaux · AURA + Grand Est
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--sm-text-dim)', marginBottom: 4 }}>
          Appuie sur un site pour lancer la recherche directement filtrée pour ton profil.
        </div>

        {SITES.map(site => (
          <a
            key={site.nom}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--sm-panel)',
              border: `1px solid ${site.couleur}33`,
              borderLeft: `4px solid ${site.couleur}`,
              borderRadius: 8, padding: '14px 16px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{site.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: site.couleur, fontSize: '1rem' }}>{site.nom}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sm-text-dim)', marginTop: 2 }}>{site.desc}</div>
            </div>
            <div style={{ color: 'var(--sm-text-dim)', fontSize: '1.1rem', flexShrink: 0 }}>↗</div>
          </a>
        ))}

        <div style={{ marginTop: 8, padding: 12, background: 'var(--sm-panel)', borderRadius: 8, border: '1px solid var(--sm-border)', fontSize: '0.75rem', color: 'var(--sm-text-dim)' }}>
          💡 Astuce : après avoir trouvé une offre, reviens sur la carte pour retrouver l'entreprise et noter tes actions dessus.
        </div>
      </div>
    </div>
  );
}
