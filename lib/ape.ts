export const APE_LIBELLES: Record<string, string> = {
  '23.51Z': 'Fabrication de ciment',
  '23.52Z': 'Fabrication de chaux et plâtre',
  '23.61Z': 'Éléments en béton pour construction',
  '23.63Z': 'Béton prêt à l\'emploi',
  '23.64Z': 'Mortiers et bétons secs',
  '23.69Z': 'Ouvrages en béton / ciment',
  '24.10Z': 'Sidérurgie / métallurgie',
  '24.20Z': 'Tubes et tuyaux en acier',
  '25.11Z': 'Structures métalliques',
  '25.21Z': 'Radiateurs et chaudières',
  '25.29Z': 'Réservoirs et citernes métal',
  '25.61Z': 'Traitement des métaux',
  '25.93Z': 'Articles en fils métalliques',
  '28.14Z': 'Robinets et vannes industriels',
  '46.72Z': 'Commerce gros minerais / métaux',
  '46.73Z': 'Négoce de matériaux de construction',
  '46.74Z': 'Négoce quincaillerie / plomberie',
  '42.11Z': 'Construction routes et autoroutes',
  '42.21Z': 'Construction réseaux fluides',
  '42.99Z': 'Génie civil / travaux publics',
};

export function getActivite(libelleApe: string, codeApe: string): string {
  return libelleApe || APE_LIBELLES[codeApe] || codeApe;
}
