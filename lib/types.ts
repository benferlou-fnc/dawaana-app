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
  /** Attribué uniquement depuis la base — jamais modifiable par un membre. */
  is_pharmacist?: boolean;
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
  /** Posé uniquement par un pharmacien via une fonction dédiée — jamais par l'auteur. */
  medication_verified: boolean;
  /** Jusqu'à 3 photos du produit (boîte, comprimés…), facultatives. */
  photo_urls: string[];
  /** Photo de la date de péremption, facultative. */
  expiration_photo_url: string | null;
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

/**
 * Le contrôle du médicament est une propriété de l'annonce elle-même (pas du
 * profil) : un pharmacien contrôle un produit précis, pas la personne.
 */
export function isMedicationVerified(item: Pick<Listing, "medication_verified">) {
  return Boolean(item.medication_verified);
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

export type NotificationType =
  | "interest"
  | "identity_verified"
  | "medication_verified"
  | "listing_moderated"
  | "interest_accepted"
  | "interest_declined"
  | "message";

/** Notification in-app. `data` porte tout le nécessaire à l'affichage, figé
 * au moment de l'événement (indépendant d'une modification ultérieure). */
export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  listing_id: string | null;
  data: {
    medication_name?: string;
    listing_type?: ListingType;
    helper_first_name?: string;
    new_status?: ListingStatus;
  };
  read_at: string | null;
  created_at: string;
}

export type ConversationStatus = "pending" | "accepted" | "declined";

/** Conversation entre l'auteur d'une annonce et une personne intéressée —
 * une par (annonce, personne), l'auteur doit l'accepter avant que le fil de
 * discussion s'ouvre. */
export interface Conversation {
  id: string;
  listing_id: string;
  owner_id: string;
  requester_id: string;
  status: ConversationStatus;
  created_at: string;
  responded_at: string | null;
  /** Prénom de l'autre participant, résolu côté serveur pour l'affichage. */
  other_first_name?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
