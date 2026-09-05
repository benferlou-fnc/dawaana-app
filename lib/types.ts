export type ListingType = "recherche" | "don";
export type Urgency = "urgent" | "normal";
export type ListingStatus = "active" | "resolue" | "retiree";
export type TripStatus = "active" | "passe" | "retire";

/**
 * Une annonce ne porte plus uniquement sur un médicament : matériel
 * d'incontinence (poches, sondes…), dispositifs médicaux, compléments…
 */
export type ListingCategory =
  | "medicament"
  | "materiel_incontinence"
  | "dispositif_medical"
  | "complement"
  | "materiel_soins"
  | "autre";

export const LISTING_CATEGORY_LABEL: Record<ListingCategory, string> = {
  medicament: "Médicament",
  materiel_incontinence: "Matériel d'incontinence",
  dispositif_medical: "Dispositif médical",
  complement: "Compléments & vitamines",
  materiel_soins: "Matériel de soins",
  autre: "Autre produit de santé",
};

/** Exemples affichés sous le champ "nom du produit" selon la catégorie choisie. */
export const LISTING_CATEGORY_EXAMPLE: Record<ListingCategory, string> = {
  medicament: "ex. Insuline glargine, Lévothyroxine…",
  materiel_incontinence: "ex. Poches de stomie, sondes urinaires, alèses…",
  dispositif_medical: "ex. Tensiomètre, glucomètre, nébuliseur, fauteuil roulant…",
  complement: "ex. Vitamine D, fer, compléments post-opératoires…",
  materiel_soins: "ex. Pansements, compresses, seringues…",
  autre: "Décrivez le produit en quelques mots",
};

export const LISTING_CATEGORIES = Object.keys(
  LISTING_CATEGORY_LABEL
) as ListingCategory[];

/** Profil public d'un membre. Ne contient jamais d'e-mail ni de téléphone. */
export interface Profile {
  id: string;
  first_name: string;
  identity_verified: boolean;
  /** Attribué uniquement depuis la base — jamais modifiable par un membre. */
  is_admin?: boolean;
  created_at?: string;
}

/** Profil joint à une publication (null pour les annonces d'avant les comptes). */
type JoinedProfile = Pick<Profile, "first_name" | "identity_verified"> | null;

export interface Listing {
  id: string;
  user_id: string | null;
  type: ListingType;
  category: ListingCategory;
  medication_name: string;
  dosage: string | null;
  quantity: string | null;
  wilaya: string;
  urgency: Urgency;
  context: string | null;
  /** Pseudonyme des toutes premières annonces, avant le passage au prénom. */
  pseudonym: string | null;
  /** Prénom figé au moment de la publication. */
  first_name: string | null;
  donor_country: string | null;
  donor_city: string | null;
  expiration_date: string | null;
  arrival_date: string | null;
  consent_at: string | null;
  status: ListingStatus;
  created_at: string;
  profiles?: JoinedProfile;
}

export interface Trip {
  id: string;
  user_id: string | null;
  first_name: string;
  from_country: string;
  from_city: string | null;
  to_wilaya: string;
  travel_date: string;
  capacity_note: string | null;
  context: string | null;
  consent_at: string | null;
  status: TripStatus;
  created_at: string;
  profiles?: JoinedProfile;
}

/** Colonnes à demander pour afficher une annonce avec son badge. */
export const LISTING_SELECT = "*, profiles(first_name, identity_verified)";
export const TRIP_SELECT = "*, profiles(first_name, identity_verified)";

/** Nom à afficher : prénom figé, sinon profil, sinon ancien pseudonyme. */
export function displayName(
  item: Pick<Listing, "first_name" | "pseudonym" | "profiles">
) {
  return (
    item.first_name?.trim() ||
    item.profiles?.first_name?.trim() ||
    item.pseudonym ||
    "Membre"
  );
}

/**
 * Le badge vient uniquement du profil : une publication ne peut pas se
 * déclarer vérifiée toute seule.
 */
export function isVerified(item: Pick<Listing, "profiles">) {
  return Boolean(item.profiles?.identity_verified);
}

/** Lieu du donateur, formaté « Lyon, France » / « France ». */
export function donorLocation(
  listing: Pick<Listing, "donor_city" | "donor_country">
) {
  return [listing.donor_city, listing.donor_country].filter(Boolean).join(", ") || null;
}

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  active: "En ligne",
  resolue: "Résolue",
  retiree: "Retirée",
};

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  active: "En ligne",
  passe: "Passé",
  retire: "Retiré",
};
