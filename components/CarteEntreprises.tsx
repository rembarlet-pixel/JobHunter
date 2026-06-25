'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import { STATUTS } from '@/lib/types';
import { getStatuts } from '@/lib/storage';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(m => m.Tooltip), { ssr: false });

export interface EntrepriseLBB {
  siret: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  naf_text: string;
  stars: number;
}

interface Props {
  entreprises: Entreprise[];
  entreprisesLBB: EntrepriseLBB[];
  filtreStatut: StatutCandidature | 'tous';
  filtreTexte: string;
  onSelect: (e: Entreprise) => void;
  selected: Entreprise | null;
}

function getCouleur(statut: StatutCandidature | undefined): string {
  if (!statut) return STATUTS.regarder.couleur;
  return STATUTS[statut]?.couleur || STATUTS.regarder.couleur;
}

export default function CarteEntreprises({ entreprises, entreprisesLBB, filtreStatut, filtreTexte, onSelect, selected }: Props) {
  const [statuts, setStatuts] = useState<Record<string, { statut: StatutCandidature }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatuts(getStatuts());
  }, []);

  useEffect(() => {
    setStatuts(getStatuts());
  }, [selected]);

  const visibles = entreprises.filter(e => {
    if (!e.lat || !e.lng) return false;
    if (filtreStatut !== 'tous') {
      const s = statuts[e.id]?.statut || 'regarder';
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
      <MapContainer center={[45.9, 5.9]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        {/* Points entreprises Sirène */}
        {visibles.map(e => {
          const statut = statuts[e.id]?.statut;
          const couleur = getCouleur(statut);
          const isSelected = selected?.id === e.id;
          return (
            <CircleMarker
              key={e.id}
              center={[e.lat!, e.lng!]}
              radius={isSelected ? 10 : 6}
              pathOptions={{ color: isSelected ? '#FFD700' : couleur, fillColor: couleur, fillOpacity: isSelected ? 1 : 0.85, weight: isSelected ? 3 : 1 }}
              eventHandlers={{ click: () => onSelect(e) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div style={{ background: '#0d1a30', color: '#e8f0fe', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', minWidth: 120 }}>
                  <div style={{ fontWeight: 700 }}>{e.nom}</div>
                  <div style={{ color: '#8ab0d0' }}>{e.ville} ({e.departement})</div>
                  {statut && <div style={{ color: couleur }}>{STATUTS[statut].emoji} {STATUTS[statut].label}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Points La Bonne Boite — rouge */}
        {entreprisesLBB.filter(c => c.lat && c.lon).map(c => (
          <CircleMarker
            key={`lbb-${c.siret}`}
            center={[c.lat, c.lon]}
            radius={7}
            pathOptions={{ color: '#CC0000', fillColor: '#CC0000', fillOpacity: 0.75, weight: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div style={{ background: '#0d1a30', color: '#e8f0fe', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: '#CC0000' }}>🔴 Recrute probablement</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{c.name}</div>
                <div style={{ color: '#8ab0d0' }}>{c.city}</div>
                <div style={{ color: '#8ab0d0', fontSize: '0.72rem' }}>{c.naf_text}</div>
                <div style={{ color: '#FFD700', fontSize: '0.7rem', marginTop: 2 }}>{'★'.repeat(Math.round(c.stars || 0))} score recrutement</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Légende */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, background: 'var(--sm-panel)', border: '1px solid var(--sm-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.7rem' }}>
        {Object.entries(STATUTS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.couleur, flexShrink: 0 }} />
            <span style={{ color: '#8ab0d0' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#CC0000', flexShrink: 0 }} />
          <span style={{ color: '#8ab0d0' }}>Recrute probablement (LBB)</span>
        </div>
        <div style={{ marginTop: 6, color: '#8ab0d0', borderTop: '1px solid #1a3a6e', paddingTop: 4 }}>
          {visibles.length} entreprises · {entreprisesLBB.length} recruteurs
        </div>
      </div>
    </div>
  );
}
