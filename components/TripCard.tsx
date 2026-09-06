import Link from "next/link";
import { isVerified, type Trip } from "@/lib/types";
import { formatDate, daysUntil } from "@/lib/relativeTime";
import { PlaneIcon, CalendarIcon } from "./icons";
import VerifiedBadge from "./VerifiedBadge";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export default function TripCard({ trip, locale }: { trip: Trip; locale: Locale }) {
  const dict = getDictionary(locale);
  const days = daysUntil(trip.travel_date);
  const soon = days >= 0 && days <= 7;
  const origin = [trip.from_city, trip.from_country ? countryLabel(trip.from_country, locale) : null]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2.5 text-brand-green-dark">
          <span className="w-11 h-11 rounded-xl bg-brand-green-tint flex items-center justify-center flex-none">
            <PlaneIcon size={18} />
          </span>
        </div>
        {soon && (
          <span className="inline-flex items-center h-[30px] px-3 rounded-full text-xs font-bold bg-brand-coral-tint text-brand-coral-dark">
            {days === 0
              ? dict.voyageDetail.arrivesToday
              : days === 1
                ? dict.voyageDetail.arrivesTomorrow
                : t(dict.voyageDetail.arrivesInDays, { n: days })}
          </span>
        )}
      </div>

      <div>
        <div className="font-bold text-base leading-snug">
          {origin} → {wilayaLabel(trip.to_wilaya, locale)}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-brand-ink-faint mt-1.5">
          <CalendarIcon />
          {formatDate(trip.travel_date, locale)}
        </div>
      </div>

      {trip.capacity_note && (
        <p className="text-[12.5px] text-brand-ink-soft leading-relaxed line-clamp-2">
          {trip.capacity_note}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-semibold">{trip.first_name}</span>
        <VerifiedBadge verified={isVerified(trip)} locale={locale} />
      </div>

      <Link
        href={`/voyages/${trip.id}`}
        className="w-full inline-flex justify-center items-center h-11 rounded-xl border border-brand-border text-brand-ink font-display font-semibold text-sm hover:bg-brand-bg transition"
      >
        {dict.voyages.viewTrip}
      </Link>
    </div>
  );
}
