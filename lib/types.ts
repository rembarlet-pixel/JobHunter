export type StatutCandidature = 'regarder' | 'interessant' | 'contacte';

export interface Entreprise {
  id: string;
  siret: string;
  siren: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: string;
  codeApe: string;
  libelleApe: string;
  trancheEffectifs?: string;
  dateCreation?: string;
  lat?: number;
  lng?: number;
  manuelle?: boolean;
}

export interface EntrepriseStatut {
  statut: StatutCandidature;
  updatedAt: string;
}

export interface EntrepriseNote {
  texte: string;
  rappel?: string;
  updatedAt: string;
}

export interface EntrepriseManuelle extends Entreprise {
  manuelle: true;
}

export const STATUTS: Record<StatutCandidature, { label: string; couleur: string; emoji: string }> = {
  regarder:    { label: 'À regarder',     couleur: '#1565C0', emoji: '🔵' },
  interessant: { label: 'Intéressant',    couleur: '#FF6F00', emoji: '🟠' },
  contacte:    { label: 'Déjà contacté',  couleur: '#FFD700', emoji: '🟡' },
};
