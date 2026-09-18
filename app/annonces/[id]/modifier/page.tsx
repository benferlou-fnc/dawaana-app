import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LISTING_SELECT, type Listing } from "@/lib/types";
import PublierForm from "@/components/PublierForm";
import { getLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modifier l'annonce — Dawaana", robots: { index: false } };

export default async function ModifierAnnoncePage({ params }: { params: { id: string } }) {
  const locale = getLocale();

  if (!isSupabaseConfigured) notFound();

  const me = await getCurrentProfile();
  if (!me) notFound();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", params.id)
    .maybeSingle();

  const listing = (data as unknown as Listing) ?? null;
  if (error || !listing) notFound();

  // Seul l'auteur (ou un administrateur) peut modifier une annonce — page
  // introuvable plutôt qu'« accès refusé » pour ne rien révéler à un tiers.
  if (listing.user_id !== me.id && !me.is_admin) notFound();

  return <PublierForm locale={locale} mode="edit" listing={listing} />;
}
