/**
 * Pays proposés pour l'emplacement d'un donateur à l'étranger.
 * Les principaux pays de la diaspora algérienne d'abord, puis le reste
 * par ordre alphabétique, et enfin « Autre pays » pour ne bloquer personne.
 */
export const DIASPORA_COUNTRIES = [
  "France",
  "Espagne",
  "Canada",
  "Belgique",
  "Royaume-Uni",
  "Allemagne",
  "Italie",
  "Suisse",
  "Turquie",
  "Tunisie",
  "Maroc",
  "Émirats arabes unis",
  "Arabie saoudite",
  "Qatar",
  "États-Unis",
  "Pays-Bas",
  "Suède",
  "Norvège",
  "Autriche",
  "Australie",
  "Autre pays",
] as const;
