'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Entreprise, StatutCandidature } from '@/lib/types';
import type { EntrepriseLBB } from '@/components/CarteEntreprises';
import companiesData from '@/data/companies-cache.json';
import { getEntreprisesManuelles, getMasquees } from '@/lib/storage';

const CarteEntreprises = dynamic(() => import('@/components/CarteEntreprises'), { ssr: false });
const FicheEntreprise = dynamic(() => import('@/components/FicheEntreprise'), { ssr: false });
const PanelListe = dynamic(() => import('@/components/PanelListe'), { ssr: false });
const OffresEmploi = dynamic(() => import('@/components/OffresEmploi'), { ssr: false });

type Vue = 'carte' | 'offres';

const DEPTS_EST = new Set([
  '01','07','26','38','42','69','73','74',
  '08','10','51','52','54','55','57','67','68','88',
]);

export default function Home() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [masquees, setMasquees] = useState<Set<string>>(new Set());
  const [entreprisesLBB, setEntreprisesLBB] = useState<EntrepriseLBB[]>([]);
  const [selected, setSelected] = useState<Entreprise | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<StatutCandidature | 'tous'>('tous');
  const [filtreTexte, setFiltreTexte] = useState('');
  const [panelOuvert, setPanelOuvert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [vue, setVue] = useState<Vue>('carte');

  useEffect(() => {
    const manuelles = getEntreprisesManuelles();
    const all = [
      ...(companiesData as Entreprise[]).filter(e => DEPTS_EST.has(e.departement)),
      ...manuelles,
    ];
    setEntreprises(all);
    setMasquees(getMasquees());

    // Charger La Bonne Boite en arrière-plan
    fetch('/api/lbb')
      .then(r => r.ok ? r.json() : { companies: [] })
      .then(d => setEntreprisesLBB(d.companies || []))
      .catch(() => {});
  }, []);

  const entreprisesVisibles = entreprises.filter(e => !masquees.has(e.id));

  const handleSelect = useCallback((e: Entreprise) => {
    setSelected(e);
    setPanelOuvert(false);
  }, []);

  const handleStatutChange = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleMasquer = useCallback((id: string) => {
    setMasquees(prev => new Set([...prev, id]));
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div style={{ height: '100dvh', width: '100dvw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* Navbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--sm-panel)',
        borderBottom: '2px solid var(--sm-border)',
        padding: '0 12px', height: 46, flexShrink: 0, zIndex: 1000,
      }}>
        <button
          onClick={() => setPanelOuvert(v => !v)}
          style={{ background: 'none', border: 'none', color: 'var(--sm-gold)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px 0 0', lineHeight: 1 }}
        >☰</button>

        <SupermanS size={26} />
        <div style={{ marginLeft: 8, fontWeight: 900, color: 'var(--sm-gold)', fontSize: '0.9rem', letterSpacing: 1 }}>
          JOB HUNTER
        </div>

        {entreprisesLBB.length > 0 && (
          <div style={{ marginLeft: 8, fontSize: '0.65rem', color: '#CC0000', fontWeight: 600 }}>
            🔴 {entreprisesLBB.length} recruteurs
          </div>
        )}

        <div style={{ flex: 1 }} />

        <OngletBtn actif={vue === 'carte'} onClick={() => setVue('carte')} label="🗺 Carte" />
        <OngletBtn actif={vue === 'offres'} onClick={() => setVue('offres')} label="📋 Offres" />
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '100%', display: vue === 'carte' ? 'flex' : 'none' }}>
          <CarteEntreprises
            entreprises={entreprisesVisibles}
            entreprisesLBB={entreprisesLBB}
            filtreStatut={filtreStatut}
            filtreTexte={filtreTexte}
            onSelect={handleSelect}
            selected={selected}
          />
        </div>

        {vue === 'offres' && <OffresEmploi />}
      </div>

      {panelOuvert && (
        <>
          <div onClick={() => setPanelOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1400 }} />
          <PanelListe
            entreprises={entreprisesVisibles}
            filtreStatut={filtreStatut}
            setFiltreStatut={setFiltreStatut}
            filtreTexte={filtreTexte}
            setFiltreTexte={setFiltreTexte}
            onSelect={e => { handleSelect(e); setPanelOuvert(false); }}
            selected={selected}
            onClose={() => setPanelOuvert(false)}
            refreshKey={refreshKey}
          />
        </>
      )}

      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1900 }} />
          <FicheEntreprise
            entreprise={selected}
            onClose={() => setSelected(null)}
            onStatutChange={handleStatutChange}
            onMasquer={handleMasquer}
          />
        </>
      )}

      {vue === 'carte' && !selected && !panelOuvert && (
        <button
          onClick={() => alert('Ajout manuel — bientôt disponible')}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
            width: 50, height: 50, borderRadius: '50%',
            background: 'var(--sm-red)', color: '#FFD700',
            border: '2px solid var(--sm-gold)', fontSize: '1.4rem',
            cursor: 'pointer', fontWeight: 900, lineHeight: 1,
            boxShadow: '0 0 16px rgba(204,0,0,0.5)',
          }}
        >+</button>
      )}
    </div>
  );
}

function OngletBtn({ actif, onClick, label }: { actif: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      background: actif ? 'rgba(255,215,0,0.12)' : 'none',
      border: actif ? '1px solid var(--sm-gold)' : '1px solid transparent',
      color: actif ? 'var(--sm-gold)' : 'var(--sm-text-dim)',
      borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
      fontSize: '0.8rem', fontWeight: actif ? 700 : 400, marginLeft: 6,
    }}>{label}</button>
  );
}

function SupermanS({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <polygon points="50,2 98,25 98,75 50,98 2,75 2,25" fill="#CC0000" stroke="#FFD700" strokeWidth="5" />
      <text x="50" y="74" textAnchor="middle" fontSize="62" fontWeight="900" fill="#FFD700" fontFamily="Arial Black, Arial">S</text>
    </svg>
  );
}
