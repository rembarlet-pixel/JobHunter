'use client';

import { useState, useEffect } from 'react';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import { STATUTS } from '@/lib/types';
import { getStatuts, getNotes } from '@/lib/storage';

interface Props {
  entreprises: Entreprise[];
  filtreStatut: StatutCandidature | 'tous';
  setFiltreStatut: (s: StatutCandidature | 'tous') => void;
  filtreTexte: string;
  setFiltreTexte: (t: string) => void;
  onSelect: (e: Entreprise) => void;
  selected: Entreprise | null;
  onClose: () => void;
  refreshKey: number;
}

export default function PanelListe({
  entreprises, filtreStatut, setFiltreStatut,
  filtreTexte, setFiltreTexte, onSelect, selected, onClose, refreshKey,
}: Props) {
  const [statuts, setStatuts] = useState<Record<string, { statut: StatutCandidature }>>({});
  const [notes, setNotes] = useState<Record<string, { rappel?: string }>>({});

  useEffect(() => {
    setStatuts(getStatuts());
    setNotes(getNotes());
  }, [refreshKey]);

  const today = new Date().toISOString().slice(0, 10);

  const visibles = entreprises.filter(e => {
    if (filtreStatut !== 'tous') {
      const s = statuts[e.id]?.statut || 'prospect';
      if (s !== filtreStatut) return false;
    }
    if (filtreTexte) {
      const t = filtreTexte.toLowerCase();
      if (!e.nom.toLowerCase().includes(t) && !e.ville.toLowerCase().includes(t) && !e.libelleApe.toLowerCase().includes(t)) return false;
    }
    return true;
  });

  // Tri : rappels en premier, puis par statut
  const ORDRE_STATUTS: StatutCandidature[] = ['entretien', 'relance', 'envoye', 'prospect', 'offre', 'refus'];
  const sorted = [...visibles].sort((a, b) => {
    const ra = notes[a.id]?.rappel;
    const rb = notes[b.id]?.rappel;
    const aRappel = ra && ra <= today;
    const bRappel = rb && rb <= today;
    if (aRappel && !bRappel) return -1;
    if (!aRappel && bRappel) return 1;
    const sa = statuts[a.id]?.statut || 'prospect';
    const sb = statuts[b.id]?.statut || 'prospect';
    return ORDRE_STATUTS.indexOf(sa) - ORDRE_STATUTS.indexOf(sb);
  });

  // Compteurs par statut
  const counts = Object.fromEntries(
    Object.keys(STATUTS).map(k => [k, 0])
  ) as Record<StatutCandidature, number>;
  entreprises.forEach(e => {
    const s = statuts[e.id]?.statut || 'prospect';
    counts[s] = (counts[s] || 0) + 1;
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: '100%', maxWidth: 360,
      background: 'var(--sm-panel)',
      borderRight: '2px solid var(--sm-border)',
      zIndex: 1500, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--sm-bg)', padding: '12px 16px',
        borderBottom: '2px solid var(--sm-border)',
        position: 'sticky', top: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SupermanLogo size={28} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--sm-gold)', fontSize: '0.95rem' }}>JOB HUNTER</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--sm-text-dim)' }}>{entreprises.length} entreprises · {Object.values(counts).reduce((a,b)=>a+b,0) - (counts.prospect || 0)} contactées</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sm-text-dim)', cursor: 'pointer', fontSize: '1.2rem' }}>☰</button>
        </div>

        {/* Recherche */}
        <input
          type="search"
          placeholder="Rechercher…"
          value={filtreTexte}
          onChange={e => setFiltreTexte(e.target.value)}
          style={{
            width: '100%', background: 'var(--sm-bg)',
            border: '1px solid var(--sm-border)', borderRadius: 6,
            color: 'var(--sm-text)', padding: '6px 10px',
            fontSize: '0.85rem', outline: 'none', marginBottom: 8,
          }}
        />

        {/* Filtres statut */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <FiltreBtn
            actif={filtreStatut === 'tous'}
            onClick={() => setFiltreStatut('tous')}
            label={`Tous (${entreprises.length})`}
            color="var(--sm-text-dim)"
          />
          {(Object.entries(STATUTS) as [StatutCandidature, typeof STATUTS[StatutCandidature]][]).map(([key, s]) => (
            <FiltreBtn
              key={key}
              actif={filtreStatut === key}
              onClick={() => setFiltreStatut(key)}
              label={`${s.emoji} ${counts[key] || 0}`}
              color={s.couleur}
              title={s.label}
            />
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--sm-text-dim)', fontSize: '0.85rem' }}>
            Aucune entreprise correspondante
          </div>
        )}
        {sorted.map(e => {
          const s = statuts[e.id]?.statut || 'prospect';
          const couleur = STATUTS[s].couleur;
          const rappelDate = notes[e.id]?.rappel;
          const hasRappel = rappelDate && rappelDate <= today;
          const isSelected = selected?.id === e.id;

          return (
            <div
              key={e.id}
              onClick={() => onSelect(e)}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--sm-border)',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,215,0,0.06)' : 'transparent',
                borderLeft: `3px solid ${isSelected ? 'var(--sm-gold)' : couleur}`,
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--sm-gold)' : 'var(--sm-text)', flex: 1 }}>
                  {hasRappel && <span style={{ marginRight: 4 }}>🔔</span>}
                  {e.nom}
                </div>
                <div style={{ fontSize: '0.65rem', color: couleur, flexShrink: 0, fontWeight: 600 }}>
                  {STATUTS[s].emoji}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sm-text-dim)', marginTop: 2 }}>
                {e.ville} ({e.departement}) · {e.libelleApe}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FiltreBtn({ actif, onClick, label, color, title }: { actif: boolean; onClick: () => void; label: string; color: string; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer',
        border: actif ? `1px solid ${color}` : '1px solid var(--sm-border)',
        background: actif ? color + '22' : 'transparent',
        color: actif ? color : 'var(--sm-text-dim)',
        fontWeight: actif ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}

function SupermanLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,2 98,25 98,75 50,98 2,75 2,25" fill="#CC0000" stroke="#FFD700" strokeWidth="4" />
      <text x="50" y="72" textAnchor="middle" fontSize="60" fontWeight="900" fill="#FFD700" fontFamily="Arial Black, Arial">S</text>
    </svg>
  );
}
