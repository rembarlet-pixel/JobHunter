export type StatutCandidature =
  | 'prospect'
  | 'envoye'
  | 'relance'
  | 'entretien'
  | 'offre'
  | 'refus';

export interface Entreprise {
  id: string; // SIRET
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
  rappel?: string; // ISO date
  updatedAt: string;
}

export interface EntrepriseManuelle extends Entreprise {
  manuelle: true;
}

export const STATUTS: Record<StatutCandidature, { label: string; couleur: string; emoji: string }> = {
  prospect: { label: 'À prospecter', couleur: '#1565C0', emoji: '🔵' },
  envoye: { label: 'Candidature envoyée', couleur: '#FFD700', emoji: '📨' },
  relance: { label: 'Relancé', couleur: '#FF6F00', emoji: '🔄' },
  entretien: { label: 'Entretien', couleur: '#CC0000', emoji: '🤝' },
  offre: { label: 'Offre reçue', couleur: '#2E7D32', emoji: '✅' },
  refus: { label: 'Refus', couleur: '#424242', emoji: '❌' },
};

export const CODES_APE: Record<string, string> = {
  '23.51Z': 'Fabrication de ciment',
  '23.52Z': 'Fabrication de chaux et plâtre',
  '23.61Z': 'Éléments en béton pour construction',
  '23.63Z': 'Béton prêt à l\'emploi',
  '23.64Z': 'Mortiers et bétons secs',
  '23.69Z': 'Ouvrages en béton/ciment/plâtre',
  '24.10Z': 'Sidérurgie',
  '24.20Z': 'Tubes et tuyaux en acier',
  '25.11Z': 'Structures métalliques',
  '25.21Z': 'Radiateurs et chaudières',
  '25.29Z': 'Réservoirs et citernes métal',
  '25.61Z': 'Traitement des métaux',
  '25.93Z': 'Articles en fils métalliques',
  '28.14Z': 'Robinets et vannes',
  '46.72Z': 'Commerce gros minerais/métaux',
  '46.73Z': 'Commerce gros matériaux construction',
  '46.74Z': 'Commerce gros quincaillerie/plomberie',
  '42.11Z': 'Construction routes et autoroutes',
  '42.21Z': 'Construction réseaux fluides',
  '42.99Z': 'Construction génie civil',
};
