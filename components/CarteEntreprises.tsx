'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import { STATUTS } from '@/lib/types';
import { getStatuts } from '@/lib/storage';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(m => m.Tooltip), { ssr: false });

interface Props {
  entreprises: Entreprise[];
  filtreStatut: StatutCandidature | 'tous';
  filtreTexte: string;
  onSelect: (e: Entreprise) => void;
  selected: Entreprise | null;
}

function getCouleur(statut: StatutCandidature | undefined): string {
  if (!statut) return STATUTS.prospect.couleur;
  return STATUTS[statut]?.couleur || STATUTS.prospect.couleur;
}

export default function CarteEntreprises({ entreprises, filtreStatut, filtreTexte, onSelect, selected }: Props) {
  const [statuts, setStatuts] = useState<Record<string, { statut: StatutCandidature }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatuts(getStatuts());
  }, []);

  // Rafraîchir les statuts depuis localStorage quand on sélectionne une entreprise
  useEffect(() => {
    setStatuts(getStatuts());
  }, [selected]);

  const visibles = entreprises.filter(e => {
    if (!e.lat || !e.lng) return false;
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

  if (!mounted) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-bg)' }}>
        <div style={{ color: 'var(--sm-gold)', fontSize: '1.2rem' }}>Chargement de la carte…</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer
        center={[45.5646, 5.9178]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {visibles.map(e => {
          const statut = statuts[e.id]?.statut;
          const couleur = getCouleur(statut);
          const isSelected = selected?.id === e.id;

          return (
            <CircleMarker
              key={e.id}
              center={[e.lat!, e.lng!]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? 'var(--sm-gold)' : couleur,
                fillColor: couleur,
                fillOpacity: isSelected ? 1 : 0.8,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{ click: () => onSelect(e) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div style={{ background: 'var(--sm-panel)', color: 'var(--sm-text)', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', minWidth: 120 }}>
                  <div style={{ fontWeight: 700 }}>{e.nom}</div>
                  <div style={{ color: 'var(--sm-text-dim)' }}>{e.ville} ({e.departement})</div>
                  {statut && <div style={{ color: couleur }}>{STATUTS[statut].emoji} {STATUTS[statut].label}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Légende */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
        background: 'var(--sm-panel)', border: '1px solid var(--sm-border)',
        borderRadius: 8, padding: '8px 12px', fontSize: '0.7rem',
      }}>
        {Object.entries(STATUTS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.couleur, flexShrink: 0 }} />
            <span style={{ color: 'var(--sm-text-dim)' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, color: 'var(--sm-text-dim)', borderTop: '1px solid var(--sm-border)', paddingTop: 4 }}>
          {visibles.length} entreprise{visibles.length > 1 ? 's' : ''} affichée{visibles.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
