import type { createClient } from "./client";

const BUCKET = "listing-photos";

/**
 * Chemin de l'objet dans le bucket à partir de son URL publique.
 * Une URL publique ressemble à :
 *   https://<projet>.supabase.co/storage/v1/object/public/listing-photos/<uid>/<fichier>
 * On ne garde que « <uid>/<fichier> », seul format accepté par storage.remove().
 * Renvoie null pour toute URL qui ne vient pas de ce bucket.
 */
export function cheminPhoto(url: string | null | undefined): string | null {
  if (!url) return null;
  const marqueur = `/${BUCKET}/`;
  const i = url.indexOf(marqueur);
  if (i === -1) return null;
  const chemin = url.slice(i + marqueur.length).split("?")[0];
  return chemin ? decodeURIComponent(chemin) : null;
}

/**
 * Supprime du bucket les photos correspondant à ces URL.
 *
 * Appelée après la suppression d'une annonce : sans cela, les fichiers
 * restaient dans un bucket public, toujours accessibles par leur URL alors
 * que l'annonce, elle, n'existait plus. Les règles du bucket restreignent
 * déjà chacun à son propre dossier (et les administrateurs à tout le
 * bucket) : ce qui n'est pas permis échoue côté serveur, pas ici.
 *
 * Volontairement silencieuse : une photo qui résiste ne doit pas faire
 * échouer la suppression de l'annonce elle-même.
 */
export async function supprimerPhotos(
  supabase: ReturnType<typeof createClient>,
  urls: (string | null | undefined)[]
): Promise<void> {
  const chemins = Array.from(
    new Set(urls.map(cheminPhoto).filter((c): c is string => Boolean(c)))
  );
  if (chemins.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(chemins);
  if (error) console.error("Photos non supprimées du stockage", error);
}

/** Toutes les URL de photos portées par une annonce. */
export function photosDeLAnnonce(
  l: { photo_urls?: string[] | null; expiration_photo_url?: string | null } | null | undefined
): string[] {
  if (!l) return [];
  return [...(l.photo_urls ?? []), l.expiration_photo_url].filter(
    (u): u is string => Boolean(u)
  );
}
