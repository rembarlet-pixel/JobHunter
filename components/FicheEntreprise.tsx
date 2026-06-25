'use client';

import { useState, useEffect } from 'react';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import { STATUTS } from '@/lib/types';
import { getStatuts, setStatut, getNotes, setNote, masquerEntreprise } from '@/lib/storage';

interface Props {
  entreprise: Entreprise;
  onClose: () => void;
  onStatutChange: () => void;
  onMasquer: (id: string) => void;
}

export default function FicheEntreprise({ entreprise, onClose, onStatutChange, onMasquer }: Props) {
  const [statut, setStatutLocal] = useState<StatutCandidature>('prospect');
  const [note, setNoteLocal] = useState('');
  const [rappel, setRappelLocal] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const statuts = getStatuts();
    const notes = getNotes();
    setStatutLocal(statuts[entreprise.id]?.statut || 'prospect');
    setNoteLocal(notes[entreprise.id]?.texte || '');
    setRappelLocal(notes[entreprise.id]?.rappel || '');
    setSaved(false);
  }, [entreprise.id]);

  function handleStatut(s: StatutCandidature) {
    setStatutLocal(s);
    setStatut(entreprise.id, s);
    onStatutChange();
  }

  function handleSaveNote() {
    setNote(entreprise.id, note, rappel || undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const couleurStatut = STATUTS[statut].couleur;

  const searchLinkedIn = () => {
    window.open(`https://www.google.com/search?q=site:linkedin.com/company+${encodeURIComponent(entreprise.nom)}`, '_blank');
  };

  const searchSocieteCom = () => {
    window.open(`https://annuaire-entreprises.data.gouv.fr/entreprise/${entreprise.siren}`, '_blank');
  };

  const searchGoogle = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(entreprise.nom + ' ' + entreprise.ville + ' recrutement')}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '100%', maxWidth: 420,
      background: 'var(--sm-panel)',
      borderLeft: '2px solid var(--sm-border)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--sm-bg)',
        borderBottom: `2px solid ${couleurStatut}`,
        padding: '12px 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, marginRight: 8 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sm-gold)', lineHeight: 1.3 }}>
              {entreprise.nom}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sm-text-dim)', marginTop: 2 }}>
              {entreprise.ville} ({entreprise.departement}) · {entreprise.libelleApe}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--sm-border)',
              color: 'var(--sm-text-dim)', borderRadius: 4,
              padding: '4px 10px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
            }}
          >✕</button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Statut */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Statut candidature
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(Object.entries(STATUTS) as [StatutCandidature, typeof STATUTS[StatutCandidature]][]).map(([key, s]) => (
              <button
                key={key}
                onClick={() => handleStatut(key)}
                style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
                  border: statut === key ? `2px solid ${s.couleur}` : '1px solid var(--sm-border)',
                  background: statut === key ? s.couleur + '22' : 'transparent',
                  color: statut === key ? s.couleur : 'var(--sm-text-dim)',
                  fontWeight: statut === key ? 700 : 400,
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Infos entreprise */}
        <div style={{ background: 'var(--sm-bg)', borderRadius: 8, padding: 12, fontSize: '0.8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <InfoLine label="SIRET" value={entreprise.siret} />
            <InfoLine label="Code APE" value={entreprise.codeApe} />
            <InfoLine label="Adresse" value={entreprise.adresse} />
            <InfoLine label="Code postal" value={entreprise.codePostal} />
            <InfoLine label="Ville" value={entreprise.ville} />
            {entreprise.trancheEffectifs && (
              <InfoLine label="Effectifs" value={trancheLabel(entreprise.trancheEffectifs)} />
            )}
            {entreprise.dateCreation && (
              <InfoLine label="Création" value={entreprise.dateCreation} />
            )}
          </div>
        </div>

        {/* Liens externes */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Recherche externe
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <BtnExt onClick={searchLinkedIn} label="LinkedIn" color="var(--sm-blue-light)" />
            <BtnExt onClick={searchSocieteCom} label="Societe.com" color="var(--sm-text-dim)" />
            <BtnExt onClick={searchGoogle} label="Google" color="var(--sm-gold)" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Notes
          </div>
          <textarea
            value={note}
            onChange={e => setNoteLocal(e.target.value)}
            placeholder="Contact, impressions, infos clés…"
            rows={5}
            style={{
              width: '100%', background: 'var(--sm-bg)',
              border: '1px solid var(--sm-border)', borderRadius: 6,
              color: 'var(--sm-text)', padding: '8px 10px',
              fontSize: '0.85rem', resize: 'vertical', outline: 'none',
            }}
          />
        </div>

        {/* Rappel */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            🔔 Rappel
          </div>
          <input
            type="date"
            value={rappel}
            onChange={e => setRappelLocal(e.target.value)}
            style={{
              background: 'var(--sm-bg)', border: '1px solid var(--sm-border)',
              borderRadius: 6, color: 'var(--sm-text)', padding: '6px 10px',
              fontSize: '0.85rem', outline: 'none', colorScheme: 'dark',
            }}
          />
        </div>

        {/* Bouton sauvegarder */}
        <button
          onClick={handleSaveNote}
          style={{
            background: saved ? 'var(--sm-success)' : 'var(--sm-red)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px', cursor: 'pointer', fontWeight: 700,
            fontSize: '0.9rem', transition: 'background 0.3s',
          }}
        >
          {saved ? '✅ Sauvegardé' : '💾 Sauvegarder les notes'}
        </button>

        {/* Bouton masquer */}
        <button
          onClick={() => {
            masquerEntreprise(entreprise.id);
            onMasquer(entreprise.id);
            onClose();
          }}
          style={{
            background: 'transparent', color: 'var(--sm-text-dim)',
            border: '1px solid var(--sm-border)', borderRadius: 8,
            padding: '8px', cursor: 'pointer', fontSize: '0.82rem',
          }}
        >
          🚫 Pas intéressant — masquer ce point
        </button>

        {entreprise.manuelle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--sm-text-dim)', textAlign: 'center' }}>
            Entreprise ajoutée manuellement
          </div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--sm-text-dim)', fontSize: '0.7rem' }}>{label}</div>
      <div style={{ color: 'var(--sm-text)', marginTop: 1 }}>{value || '—'}</div>
    </div>
  );
}

function BtnExt({ onClick, label, color }: { onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--sm-bg)', border: `1px solid ${color}`,
        color: color, borderRadius: 6, padding: '5px 12px',
        fontSize: '0.78rem', cursor: 'pointer',
      }}
    >
      {label} ↗
    </button>
  );
}

function trancheLabel(code: string): string {
  const map: Record<string, string> = {
    '12': '20-49 salariés', '21': '50-99 salariés', '22': '100-199 salariés',
    '31': '200-249 salariés', '32': '250-499 salariés', '41': '500-999 salariés',
    '42': '1000-1999 salariés', '51': '2000-4999 salariés', '52': '5000-9999 salariés',
    '53': '10000+ salariés',
  };
  return map[code] || code;
}
