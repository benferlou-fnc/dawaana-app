import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LISTING_SELECT, type Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import { SearchIcon, GiftIcon, CheckIcon, ArrowRightIcon, ShieldIcon, ShieldCheckIcon, MapPinIcon } from "@/components/icons";

// Aucune mise en cache : une demande de médicament urgente doit apparaître
// immédiatement. Le volume de données est minuscule, il n'y a rien à gagner
// à servir une version figée.
export const dynamic = "force-dynamic";

async function getRecentListings(): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) {
    console.error(error);
    return [];
  }
  return data as Listing[];
}

export default async function HomePage() {
  const listings = await getRecentListings();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-32 w-[420px] h-[420px] rounded-full bg-brand-green-tint blur-2xl opacity-70" />
        <div className="absolute -bottom-48 -left-24 w-[380px] h-[380px] rounded-full bg-brand-coral-tint blur-2xl opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-14 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 w-fit rounded-full bg-brand-green-tint text-brand-green-dark text-xs font-bold px-3 h-[30px]">
              <ShieldIcon size={14} />
              Projet associatif à but non lucratif
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-[3.2rem] leading-[1.08]">
              Le médicament qui manque ici existe peut-être là-bas.
            </h1>
            <p className="text-lg text-brand-ink-soft leading-relaxed max-w-lg">
              Dawaana relie les familles en Algérie à la diaspora et à la
              communauté locale pour partager les médicaments rares ou
              introuvables —{" "}
              <strong className="text-brand-ink">
                gratuitement, sans jamais d&apos;argent en jeu.
              </strong>
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/annonces"
                className="inline-flex items-center gap-2 h-[54px] px-6 rounded-xl bg-brand-coral text-white font-display font-semibold hover:brightness-95 transition"
              >
                <SearchIcon size={18} />
                Je cherche un produit
              </Link>
              <Link
                href="/publier"
                className="inline-flex items-center gap-2 h-[54px] px-6 rounded-xl border-[1.5px] border-brand-green text-brand-green-dark font-display font-semibold hover:bg-brand-green-tint transition"
              >
                <GiftIcon size={18} />
                J&apos;ai un produit à donner
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-2 text-[13px] font-medium text-brand-ink-faint">
              <span className="flex items-center gap-2">
                <CheckIcon /> 100% gratuit, toujours
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Remise en main propre, jamais par la poste
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Prénom seul, jamais votre nom complet
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {listings.length === 0 ? (
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-sm text-brand-ink-faint">
                {isSupabaseConfigured
                  ? "Aucune annonce pour le moment — soyez le premier à en publier une."
                  : "Connectez Supabase pour afficher les annonces en direct ici."}
              </div>
            ) : (
              listings.map((l) => <ListingCard key={l.id} listing={l} />)
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment-ca-marche" className="bg-brand-surface border-y border-brand-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mx-auto text-center flex flex-col gap-3 mb-14">
            <h2 className="font-display font-extrabold text-3xl">Comment ça marche</h2>
            <p className="text-brand-ink-soft">
              Trois étapes simples, pensées pour la sécurité de tous — aucune
              vente, aucun envoi postal de produits.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <div className="w-[52px] h-[52px] rounded-2xl bg-brand-coral-tint flex items-center justify-center text-brand-coral-dark">
                <SearchIcon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg">1. Publiez votre besoin ou votre don</h3>
              <p className="text-sm text-brand-ink-soft leading-relaxed">
                Nom du produit, catégorie, wilaya, niveau d&apos;urgence.
                Aucune coordonnée personnelle n&apos;est rendue publique.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-[52px] h-[52px] rounded-2xl bg-brand-green-tint flex items-center justify-center text-brand-green-dark">
                <ShieldCheckIcon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg">2. La communauté répond</h3>
              <p className="text-sm text-brand-ink-soft leading-relaxed">
                Faire valider chaque don par un pharmacien bénévole est
                l&apos;objectif du projet — le réseau reste à constituer. En
                attendant, vérifiez vous-même péremption et emballage.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-[52px] h-[52px] rounded-2xl bg-brand-coral-tint flex items-center justify-center text-brand-coral-dark">
                <MapPinIcon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg">3. Remise en main propre</h3>
              <p className="text-sm text-brand-ink-soft leading-relaxed">
                Directement entre les deux personnes, dans un lieu public et
                convenu — jamais par voie postale, et sans aucun échange
                d&apos;argent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-[28px] bg-gradient-to-br from-brand-green-dark to-brand-green px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg flex flex-col gap-3">
            <h2 className="text-white font-display font-extrabold text-2xl">
              Un médicament qui dort dans votre pharmacie peut sauver
              quelqu&apos;un.
            </h2>
            <p className="text-green-50/90 text-sm leading-relaxed">
              Rentrer d&apos;un voyage avec un reliquat, ou en avoir chez vous
              sans usage ? Proposez-le à la communauté, gratuitement.
            </p>
          </div>
          <Link
            href="/publier"
            className="inline-flex items-center gap-2 h-[54px] px-7 rounded-xl bg-white text-brand-green-dark font-display font-semibold shrink-0"
          >
            Proposer un don
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}
