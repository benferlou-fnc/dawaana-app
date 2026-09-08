import Link from "next/link";
import {
  displayName,
  donorLocation,
  isVerified,
  type Listing,
} from "@/lib/types";
import { relativeTime } from "@/lib/relativeTime";
import { MapPinIcon, GlobeIcon, TagIcon } from "./icons";
import VerifiedBadge from "./VerifiedBadge";
import MedicationVerifiedBadge from "./MedicationVerifiedBadge";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export default function ListingCard({ listing, locale }: { listing: Listing; locale: Locale }) {
  const dict = getDictionary(locale);
  const isDon = listing.type === "don";
  const isUrgent = listing.urgency === "urgent";
  const abroad = isDon ? donorLocation(listing) : null;

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            isDon ? "bg-brand-green-tint" : "bg-brand-coral-tint"
          }`}
        >
          <span className={`font-display font-bold ${isDon ? "text-brand-green-dark" : "text-brand-coral-dark"}`}>
            {listing.medication_name.slice(0, 1).toUpperCase()}
          </span>
        </div>
        {isDon ? (
          <span className="inline-flex items-center h-[30px] px-3 rounded-full text-xs font-bold bg-brand-surface border border-brand-border text-brand-ink-soft">
            {dict.listingCard.don}
          </span>
        ) : (
          <span
            className={`inline-flex items-center h-[30px] px-3 rounded-full text-xs font-bold ${
              isUrgent
                ? "bg-brand-coral-tint text-brand-coral-dark"
                : "bg-brand-green-tint text-brand-green-dark"
            }`}
          >
            {isUrgent ? dict.listingCard.urgent : dict.listingCard.normal}
          </span>
        )}
      </div>

      <div>
        <div className="font-bold text-base">{listing.medication_name}</div>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-ink-faint mt-1">
          <TagIcon size={11} />
          {dict.categories[listing.category] ?? dict.categories.medicament}
        </div>
        <div className="text-[13px] text-brand-ink-faint mt-1">
          {[listing.dosage, listing.quantity].filter(Boolean).join(" · ")}
        </div>
      </div>

      {listing.context && (
        <p className="text-[12.5px] italic text-brand-ink-soft leading-relaxed line-clamp-2">
          « {listing.context} »
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-semibold">{displayName(listing)}</span>
        <VerifiedBadge verified={isVerified(listing)} locale={locale} />
        {isDon && <MedicationVerifiedBadge verified={listing.medication_verified} locale={locale} />}
      </div>

      <div className="flex items-center gap-3.5 text-xs text-brand-ink-faint flex-wrap">
        <span className="flex items-center gap-1.5">
          <MapPinIcon />
          {wilayaLabel(listing.wilaya, locale)}
        </span>
        {abroad && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <GlobeIcon />
              {dict.listingCard.since} {countryLabel(abroad, locale)}
            </span>
          </>
        )}
        <span>·</span>
        <span>{relativeTime(listing.created_at, locale)}</span>
      </div>

      <Link
        href={`/annonces/${listing.id}`}
        className={`w-full inline-flex justify-center items-center h-11 rounded-xl font-display font-semibold text-sm transition ${
          isDon
            ? "border border-brand-border text-brand-ink hover:bg-brand-bg"
            : "bg-brand-coral text-white hover:brightness-95"
        }`}
      >
        {isDon ? dict.listingCard.viewListing : dict.listingCard.canHelp}
      </Link>
    </div>
  );
}
