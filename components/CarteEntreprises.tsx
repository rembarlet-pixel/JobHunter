'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import { STATUTS } from '@/lib/types';
import { getStatuts } from '@/lib/storage';
import { getActivite } from '@/lib/ape';

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

// Tranches effectifs = 50+ employés (inclut 60+)
const LARGE_TRANCHES = new Set(['21','22','31','32','41','42','51','52','53']);
const COULEUR_VIOLET = '#9C27B0';
const COULEUR_LBB = '#CC0000';

function getCouleur(statut: StatutCandidature | undefined, tranche: string | undefined): string {
  // CRM qualifié → couleur CRM
  if (statut && statut !== 'regarder') return STATUTS[statut].couleur;
  // Grande entreprise (>50 emp) → violet
  if (LARGE_TRANCHES.has(tranche || '')) return COULEUR_VIOLET;
  // Default → bleu
  return STATUTS.regarder.couleur;
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
      const act = getActivite(e.libelleApe, e.codeApe).toLowerCase();
      if (!e.nom.toLowerCase().includes(t) && !e.ville.toLowerCase().includes(t) && !act.includes(t)) return false;
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
          const couleur = getCouleur(statut, e.trancheEffectifs);
          const isSelected = selected?.id === e.id;
          return (
            <CircleMarker
              key={e.id}
              center={[e.lat!, e.lng!]}
              radius={isSelected ? 18 : 14}
              pathOptions={{
                color: isSelected ? '#FFD700' : couleur,
                fillColor: couleur,
                fillOpacity: isSelected ? 1 : 0.82,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{ click: () => onSelect(e) }}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={0.97}>
                <div style={{ background: '#0d1a30', color: '#e8f0fe', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', minWidth: 130 }}>
                  <div style={{ fontWeight: 700 }}>{e.nom}</div>
                  <div style={{ color: '#8ab0d0' }}>{e.ville} ({e.departement})</div>
                  <div style={{ color: '#8ab0d0', fontSize: '0.7rem' }}>{getActivite(e.libelleApe, e.codeApe)}</div>
                  {statut && statut !== 'regarder' && (
                    <div style={{ color: couleur, marginTop: 2 }}>{STATUTS[statut].emoji} {STATUTS[statut].label}</div>
                  )}
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
            radius={12}
            pathOptions={{ color: COULEUR_LBB, fillColor: COULEUR_LBB, fillOpacity: 0.75, weight: 1.5 }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.97}>
              <div style={{ background: '#0d1a30', color: '#e8f0fe', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', minWidth: 150 }}>
                <div style={{ fontWeight: 700, color: COULEUR_LBB }}>🔴 Recrute probablement</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{c.name}</div>
                <div style={{ color: '#8ab0d0' }}>{c.city}</div>
                <div style={{ color: '#8ab0d0', fontSize: '0.7rem' }}>{c.naf_text}</div>
                {c.stars > 0 && (
                  <div style={{ color: '#FFD700', fontSize: '0.7rem', marginTop: 2 }}>
                    {'★'.repeat(Math.min(Math.round(c.stars), 5))} score recrutement
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Légende */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, background: 'rgba(13,26,48,0.95)', border: '1px solid #1a3a6e', borderRadius: 8, padding: '8px 12px', fontSize: '0.7rem' }}>
        {Object.entries(STATUTS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.couleur, flexShrink: 0 }} />
            <span style={{ color: '#8ab0d0' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COULEUR_VIOLET, flexShrink: 0 }} />
          <span style={{ color: '#8ab0d0' }}>Grande entreprise (50+ salariés)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COULEUR_LBB, flexShrink: 0 }} />
          <span style={{ color: '#8ab0d0' }}>Recrute probablement (LBB)</span>
        </div>
        <div style={{ marginTop: 6, color: '#8ab0d0', borderTop: '1px solid #1a3a6e', paddingTop: 4 }}>
          {visibles.length} entreprises · {entreprisesLBB.length} recruteurs LBB
        </div>
      </div>
    </div>
  );
}
