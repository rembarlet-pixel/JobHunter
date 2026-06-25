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
  const [statut, setStatutLocal] = useState<StatutCandidature>('regarder');
  const [note, setNoteLocal] = useState('');
  const [rappel, setRappelLocal] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const statuts = getStatuts();
    const notes = getNotes();
    setStatutLocal(statuts[entreprise.id]?.statut || 'regarder');
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

  function handleSupprimer() {
    masquerEntreprise(entreprise.id);
    onMasquer(entreprise.id);
    onClose();
  }

  const couleurStatut = STATUTS[statut]?.couleur ?? '#1565C0';

  const urlLinkedIn = `https://www.google.com/search?q=site:linkedin.com/company+${encodeURIComponent(entreprise.nom)}`;
  const urlAnnuaire = `https://annuaire-entreprises.data.gouv.fr/entreprise/${entreprise.siren}`;
  const urlGoogle = `https://www.google.com/search?q=${encodeURIComponent(entreprise.nom + ' ' + entreprise.ville + ' recrutement')}`;

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
              {entreprise.ville} ({entreprise.departement})
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--sm-border)', color: 'var(--sm-text-dim)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Statuts + Supprimer */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sm-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Statut
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(Object.entries(STATUTS) as [StatutCandidature, typeof STATUTS[StatutCandidature]][]).map(([key, s]) => (
              <button
                key={key}
                onClick={() => handleStatut(key)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
                  border: statut === key ? `2px solid ${s.couleur}` : '1px solid var(--sm-border)',
                  background: statut === key ? s.couleur + '22' : 'transparent',
                  color: statut === key ? s.couleur : 'var(--sm-text-dim)',
                  fontWeight: statut === key ? 700 : 400,
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
            <button
              onClick={handleSupprimer}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
                border: '1px solid #424242', background: 'transparent',
                color: '#888',
              }}
            >
              🗑 Supprimer
            </button>
          </div>
        </div>

        {/* Infos entreprise */}
        <div style={{ background: 'var(--sm-bg)', borderRadius: 8, padding: 12, fontSize: '0.8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <InfoLine label="Activité" value={entreprise.libelleApe} />
            <InfoLine label="Code APE" value={entreprise.codeApe} />
            <InfoLine label="Adresse" value={entreprise.adresse} />
            <InfoLine label="Ville" value={`${entreprise.codePostal} ${entreprise.ville}`} />
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
            <LienExt href={urlLinkedIn} label="LinkedIn" color="var(--sm-blue-light)" />
            <LienExt href={urlAnnuaire} label="Annuaire" color="var(--sm-text-dim)" />
            <LienExt href={urlGoogle} label="Google" color="var(--sm-gold)" />
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
            rows={4}
            style={{ width: '100%', background: 'var(--sm-bg)', border: '1px solid var(--sm-border)', borderRadius: 6, color: 'var(--sm-text)', padding: '8px 10px', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
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
            style={{ background: 'var(--sm-bg)', border: '1px solid var(--sm-border)', borderRadius: 6, color: 'var(--sm-text)', padding: '6px 10px', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }}
          />
        </div>

        <button
          onClick={handleSaveNote}
          style={{
            background: saved ? '#2E7D32' : 'var(--sm-red)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px', cursor: 'pointer', fontWeight: 700,
            fontSize: '0.9rem', transition: 'background 0.3s',
          }}
        >
          {saved ? '✅ Sauvegardé' : '💾 Sauvegarder les notes'}
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

function LienExt({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'var(--sm-bg)', border: `1px solid ${color}`, color, borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', textDecoration: 'none' }}>
      {label} ↗
    </a>
  );
}

function trancheLabel(code: string): string {
  const map: Record<string, string> = {
    '11': '10-19 salariés', '12': '20-49 salariés', '21': '50-99 salariés',
    '22': '100-199 salariés', '31': '200-249 salariés', '32': '250-499 salariés',
    '41': '500-999 salariés', '42': '1000-1999 salariés', '51': '2000-4999 salariés',
    '52': '5000-9999 salariés', '53': '10000+ salariés',
  };
  return map[code] || code;
}
