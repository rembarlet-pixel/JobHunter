'use client';

import { useState, useEffect } from 'react';

interface Offre {
  id: string;
  intitule: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string };
  typeContrat?: string;
  dateCreation?: string;
  origineOffre?: { urlOrigine?: string };
  description?: string;
  salaire?: { libelle?: string };
}

export default function OffresEmploi() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function chargerOffres() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/offres');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setOffres(data.resultats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerOffres();
  }, []);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--sm-bg)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--sm-panel)',
        borderBottom: '2px solid var(--sm-red)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--sm-gold)', fontSize: '1rem' }}>📋 OFFRES D'EMPLOI</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)' }}>
            Via France Travail · Responsable commercial / BTP
          </div>
        </div>
        <button
          onClick={chargerOffres}
          disabled={loading}
          style={{
            marginLeft: 'auto', background: 'var(--sm-red)', color: '#fff',
            border: 'none', borderRadius: 6, padding: '6px 14px',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳' : '🔄 Actualiser'}
        </button>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        {error && (
          <div style={{
            background: '#2a0a0a', border: '1px solid var(--sm-red)',
            borderRadius: 8, padding: 16, marginBottom: 16, color: '#ff8080',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Connexion impossible</div>
            <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{error}</div>
          </div>
        )}

        {!loading && !error && offres.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--sm-text-dim)', padding: 40 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
            <div>Aucune offre trouvée</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {offres.map(offre => (
            <div key={offre.id} style={{ background: 'var(--sm-panel)', border: '1px solid var(--sm-border)', borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => setExpanded(expanded === offre.id ? null : offre.id)} style={{ padding: '12px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--sm-text)', fontSize: '0.9rem', flex: 1 }}>{offre.intitule}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--sm-blue-light)', flexShrink: 0 }}>{offre.typeContrat || 'CDI'}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--sm-text-dim)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>🏢 {offre.entreprise?.nom || 'Confidentiel'}</span>
                  <span>📍 {offre.lieuTravail?.libelle || '—'}</span>
                </div>
                {offre.salaire?.libelle && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--sm-gold)', marginTop: 2 }}>💰 {offre.salaire.libelle}</div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--sm-text-dim)', marginTop: 4 }}>
                  {offre.dateCreation ? new Date(offre.dateCreation).toLocaleDateString('fr-FR') : '—'} · {expanded === offre.id ? '▲ Réduire' : '▼ Voir plus'}
                </div>
              </div>

              {expanded === offre.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--sm-border)' }}>
                  {offre.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--sm-text-dim)', marginTop: 12, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', lineHeight: 1.5 }}>
                      {offre.description.slice(0, 600)}{offre.description.length > 600 ? '…' : ''}
                    </div>
                  )}
                  {offre.origineOffre?.urlOrigine && (
                    <a href={offre.origineOffre.urlOrigine} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, background: 'var(--sm-red)', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 700 }}>
                      Voir l'offre ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
