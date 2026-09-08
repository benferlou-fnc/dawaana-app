import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  displayName,
  donorLocation,
  isVerified,
  LISTING_SELECT,
  type Listing,
} from "@/lib/types";
import { relativeTime, formatDate } from "@/lib/relativeTime";
import HelpButton from "@/components/HelpButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import MedicationVerifiedBadge from "@/components/MedicationVerifiedBadge";
import { MapPinIcon, ShieldIcon, GlobeIcon, TagIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

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
  const locale = getLocale();
  const dict = getDictionary(locale);
  const listing = await getListing(params.id);
  if (!listing) notFound();

  const isDon = listing.type === "don";
  const location = donorLocation(listing);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/annonces" className="text-[13.5px] text-brand-ink-faint font-medium mb-6 inline-block">
        {dict.annonceDetail.back}
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
                      {dict.categories[listing.category] ?? dict.categories.medicament}
                    </span>
                    <span>·</span>
                    <span>
                      {relativeTime(listing.created_at, locale)} · {dict.annonceDetail.publishedBy}{" "}
                      {displayName(listing)}
                    </span>
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <VerifiedBadge verified={isVerified(listing)} locale={locale} />
                    {isDon && (
                      <MedicationVerifiedBadge verified={listing.medication_verified} locale={locale} />
                    )}
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
                  {listing.urgency === "urgent" ? dict.listingCard.urgent : dict.listingCard.normal}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-brand-border">
              {listing.dosage && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">{dict.annonceDetail.dosage}</div>
                  <div className="text-sm font-semibold">{listing.dosage}</div>
                </div>
              )}
              {listing.quantity && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">{dict.annonceDetail.quantity}</div>
                  <div className="text-sm font-semibold">{listing.quantity}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-brand-ink-faint mb-1">{dict.annonceDetail.wilaya}</div>
                <div className="text-sm font-semibold">{wilayaLabel(listing.wilaya, locale)}</div>
              </div>
              {listing.arrival_date && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">{dict.annonceDetail.arrivalDate}</div>
                  <div className="text-sm font-semibold">{formatDate(listing.arrival_date, locale)}</div>
                </div>
              )}
              {location && (
                <div>
                  <div className="text-xs text-brand-ink-faint mb-1">{dict.annonceDetail.donorLocation}</div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <GlobeIcon />
                    {countryLabel(location, locale)}
                  </div>
                </div>
              )}
            </div>

            {listing.context && (
              <div className="pt-2 border-t border-brand-border">
                <div className="text-xs text-brand-ink-faint mb-2">
                  {isDon ? dict.annonceDetail.contextByDonor : dict.annonceDetail.contextByRequester}
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
              <strong className="text-brand-ink">{dict.annonceDetail.verificationNotReadyStrong}</strong>{" "}
              {dict.annonceDetail.verificationNotReadyBody}
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[360px] flex flex-col gap-5 flex-none">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-7 flex flex-col gap-4">
            <h3 className="font-display font-bold text-base">{dict.annonceDetail.howToHelp}</h3>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                1
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">{dict.annonceDetail.step1}</p>
            </div>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                2
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">{dict.annonceDetail.step2}</p>
            </div>
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] rounded-lg bg-brand-coral-tint text-brand-coral-dark font-display font-extrabold text-xs flex items-center justify-center flex-none">
                3
              </div>
              <p className="text-[13.5px] text-brand-ink-soft leading-relaxed">{dict.annonceDetail.step3}</p>
            </div>
            <HelpButton listingType={listing.type} locale={locale} />
            <p className="text-[11.5px] text-brand-ink-faint text-center">{dict.annonceDetail.noPersonalDataYet}</p>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl px-7 py-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPinIcon size={16} className="text-brand-ink-soft" />
              <span className="text-[13.5px] font-bold">{dict.annonceDetail.relayPoint}</span>
            </div>
            <p className="text-[13px] text-brand-ink-faint leading-relaxed">{dict.annonceDetail.relayPointBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
