import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeUrl, safeKey } from "./config";

/**
 * Client à utiliser dans les composants serveur et les routes.
 * Il lit la session dans les cookies, ce qui permet aux règles de sécurité
 * de la base de savoir qui consulte la page.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(safeUrl, safeKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Écriture impossible depuis un composant serveur : c'est le
          // middleware qui rafraîchit la session, rien à signaler ici.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Idem.
        }
      },
    },
  });
}

/** Renvoie l'utilisateur connecté, ou null. */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Utilisateur connecté + son profil public (prénom, badge). */
export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, identity_verified, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return data ? { ...data, email: user.email ?? null } : null;
}
