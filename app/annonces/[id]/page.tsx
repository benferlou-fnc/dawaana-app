import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  displayName,
  donorLocation,
  isVerified,
  LISTING_SELECT,
  LISTING_CATEGORY_LABEL,
  type Listing,
} from "@/lib/types";
import { relativeTimeFr, formatDateFr } from "@/lib/relativeTime";
import HelpButton from "@/components/HelpButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { MapPinIcon, ShieldIcon, GlobeIcon, TagIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

async function getListing(id: string): Promise<Listing | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Listing;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  const isDon = listing.type === "don";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/annonces" className="text-[13.5px] text-brand-ink-faint font-medium mb-6 inline-block">
        ← Retour aux demandes
      </Link>

      <div className="flex flex-col lg:flex-row gap-9 items-start">
        <div className="flex-1 flex flex-col gap-6 w-full">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-9 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-start">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-none ${
                    isDon ? "bg-brand-green-tint text-brand-green-dark" : "bg-brand-coral-tint text-brand-coral-dark"
                  }`}
                >
                  {listing.medication_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h1 className="font-display font-extrabold text-2xl">{listing.medication_name}</h1>
                  <p className="text-brand-ink-faint text-[13.5px] mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-ink-soft">
                      <TagIcon size={12} />
                      {LISTING_CATEGORY_LABEL[listing.category] ?? LISTING_CATEGORY_LABEL.medicament}
                    </span>
                    <span>·</span>
                    <span>
                      {relativeTimeFr(listing.created_at)} · publié par {displayName(listing)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <VerifiedBadge verified={isVerified(listing)} />
                  </div>
                </div>
              </div>
              {!isDon && (
                <span
                  className={`inline-flex items-center h-[30px] px-3 rounded-full text-xs font-bold ${
                    listing.urgency === "urgent"
                      ? "bg-brand-coral-tint text-brand-coral-dark"
                      : "bg-brand-green-tint text-brand-green-dark"
                  }`}
                >
                  {listing.urgency === "urgent" ? "Urgent" : "Normal"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-brand-border">
              {listing.dosage && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">Dosage</div>
                  <div className="text-sm font-semibold">{listing.dosage}</div>
                </div>
              )}
              {listing.quantity && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">Quantité</div>
                  <div className="text-sm font-semibold">{listing.quantity}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-brand-ink-faint mb-1">Wilaya</div>
                <div className="text-sm font-semibold">{listing.wilaya}</div>
              </div>
              {listing.arrival_date && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">Arrivée prévue</div>
                  <div className="text-sm font-semibold">{formatDateFr(listing.arrival_date)}</div>
                </div>
              )}
              {donorLocation(listing) && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">Donateur situé à</div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <GlobeIcon />
                    {donorLocation(listing)}
                  </div>
                </div>
              )}
            </div>

            {listing.context && (
              <div className="pt-2 border-t border-brand-border">
                <div className="text-xs text-brand-ink-faint mb-2">
                  Contexte partagé par {isDon ? "le donateur" : "le demandeur"}
                </div>
                <p className="text-sm leading-relaxed text-brand-ink-soft">« {listing.context} »</p>
              </div>
            )}
          </div>

          <div className="bg-brand-surface border-[1.5px] border-dashed border-brand-border rounded-2xl px-9 py-7 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center flex-none text-brand-ink-soft">
              <ShieldIcon size={20} />
            </div>
            <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">
              <strong className="text-brand-ink">
                La vérification par un pharmacien bénévole n&apos;est pas encore
                en place.
              </strong>{" "}
              C&apos;est l&apos;objectif du projet, mais le réseau de bénévoles
              reste à constituer : en attendant, vérifiez vous-même la date de
              péremption, l&apos;emballage d&apos;origine et demandez l&apos;avis
              de votre pharmacien avant toute prise.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[360px] flex flex-col gap-5 flex-none">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-7 flex flex-col gap-4">
            <h3 className="font-display font-bold text-base">Comment aider</h3>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                1
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">
                Cliquez ci-dessous, sans donner vos coordonnées.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                2
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">
                La mise en relation se fera par messagerie — en cours de
                construction.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                3
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">
                Remise en main propre. Ni vente, ni envoi postal.
              </p>
            </div>
            <HelpButton listingType={listing.type} />
            <p className="text-[11.5px] text-brand-ink-faint text-center">
              Aucune donnée personnelle partagée à ce stade
            </p>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl px-7 py-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPinIcon size={16} className="text-brand-ink-soft" />
              <span className="text-[13.5px] font-bold">Point relais</span>
            </div>
            <p className="text-[13px] text-brand-ink-faint leading-relaxed">
              L&apos;adresse exacte est communiquée après vérification par un
              bénévole.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
