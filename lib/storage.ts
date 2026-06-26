import type { EntrepriseStatut, EntrepriseNote, EntrepriseManuelle, StatutCandidature } from './types';

const KEYS = {
  statuts: 'jh-statuts',
  notes: 'jh-notes',
  manuelles: 'jh-manuelles',
  masquees: 'jh-masquees',
  emails: 'jh-emails',
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Statuts
export function getStatuts(): Record<string, EntrepriseStatut> {
  return load(KEYS.statuts, {});
}

export function setStatut(id: string, statut: StatutCandidature) {
  const statuts = getStatuts();
  statuts[id] = { statut, updatedAt: new Date().toISOString() };
  save(KEYS.statuts, statuts);
}

// Notes
export function getNotes(): Record<string, EntrepriseNote> {
  return load(KEYS.notes, {});
}

export function setNote(id: string, texte: string, rappel?: string) {
  const notes = getNotes();
  notes[id] = { texte, rappel, updatedAt: new Date().toISOString() };
  save(KEYS.notes, notes);
}

// Entreprises manuelles (Suisse + autres hors Sirène)
export function getEntreprisesManuelles(): EntrepriseManuelle[] {
  return load(KEYS.manuelles, []);
}

export function addEntrepriseManuelle(e: EntrepriseManuelle) {
  const list = getEntreprisesManuelles();
  list.push(e);
  save(KEYS.manuelles, list);
}

export function removeEntrepriseManuelle(id: string) {
  const list = getEntreprisesManuelles().filter(e => e.id !== id);
  save(KEYS.manuelles, list);
}

// Entreprises masquées (pas intéressantes)
export function getMasquees(): Set<string> {
  return new Set(load<string[]>(KEYS.masquees, []));
}

export function masquerEntreprise(id: string) {
  const set = getMasquees();
  set.add(id);
  save(KEYS.masquees, [...set]);
}

export function demasquerEntreprise(id: string) {
  const set = getMasquees();
  set.delete(id);
  save(KEYS.masquees, [...set]);
}

// Emails de contact
export function getEmails(): Record<string, string> {
  return load<Record<string, string>>(KEYS.emails, {});
}

export function setEmail(id: string, email: string) {
  const emails = getEmails();
  if (email) emails[id] = email;
  else delete emails[id];
  save(KEYS.emails, emails);
}
