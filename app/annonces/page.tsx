import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  LISTING_SELECT,
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABEL,
  type Listing,
  type ListingCategory,
} from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import { WILAYAS } from "@/lib/wilayas";
import { SearchIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function isListingCategory(value: string): value is ListingCategory {
  return (LISTING_CATEGORIES as string[]).includes(value);
}

async function getListings(searchParams: {
  wilaya?: string;
  type?: string;
  categorie?: string;
  urgent?: string;
  q?: string;
}): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = createClient();
  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (searchParams.wilaya) query = query.eq("wilaya", searchParams.wilaya);
  if (searchParams.type === "recherche" || searchParams.type === "don")
    query = query.eq("type", searchParams.type);
  if (searchParams.categorie && isListingCategory(searchParams.categorie))
    query = query.eq("category", searchParams.categorie);
  if (searchParams.urgent === "1") query = query.eq("urgency", "urgent");
  if (searchParams.q) query = query.ilike("medication_name", `%${searchParams.q}%`);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data as Listing[];
}

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: { wilaya?: string; type?: string; categorie?: string; urgent?: string; q?: string };
}) {
  const listings = await getListings(searchParams);

  return (
    <div className="max-w-6xl mx-auto px-6 py-11">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-[28px]">
          Demandes &amp; dons en cours
        </h1>
        <p className="text-brand-ink-soft text-sm mt-1">
          {listings.length} annonce{listings.length !== 1 ? "s" : ""} active
          {listings.length !== 1 ? "s" : ""}
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-3 mb-9" method="get">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 h-11 px-4 rounded-xl border-[1.5px] border-brand-border bg-brand-surface">
          <SearchIcon size={16} className="text-brand-ink-faint" />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Rechercher un produit (nom, DCI)…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-brand-ink-faint"
          />
        </div>
        <select
          name="wilaya"
          defaultValue={searchParams.wilaya ?? ""}
          className="h-11 px-4 rounded-xl border-[1.5px] border-brand-border bg-brand-surface text-sm text-brand-ink-soft"
        >
          <option value="">Toutes les wilayas</option>
          {WILAYAS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={searchParams.type ?? ""}
          className="h-11 px-4 rounded-xl border-[1.5px] border-brand-border bg-brand-surface text-sm text-brand-ink-soft"
        >
          <option value="">Demandes &amp; dons</option>
          <option value="recherche">Demandes uniquement</option>
          <option value="don">Dons uniquement</option>
        </select>
        <select
          name="categorie"
          defaultValue={searchParams.categorie ?? ""}
          className="h-11 px-4 rounded-xl border-[1.5px] border-brand-border bg-brand-surface text-sm text-brand-ink-soft"
        >
          <option value="">Toutes les catégories</option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {LISTING_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <label className="h-11 px-4 rounded-xl border-[1.5px] border-brand-coral bg-brand-coral-tint text-brand-coral-dark text-sm flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="urgent"
            value="1"
            defaultChecked={searchParams.urgent === "1"}
            className="accent-brand-coral"
          />
          Urgent uniquement
        </label>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-brand-ink text-white text-sm font-display font-semibold"
        >
          Filtrer
        </button>
      </form>

      {!isSupabaseConfigured ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-ink-faint text-sm">
          Connectez Supabase (variables d&apos;environnement) pour afficher
          les annonces en direct.
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-ink-faint text-sm">
          Aucune annonce ne correspond à ces filtres pour le moment.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
