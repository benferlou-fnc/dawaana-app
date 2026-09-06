import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type Listing, type Trip } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/relativeTime";
import VerifiedBadge from "@/components/VerifiedBadge";
import SignOutButton from "@/components/SignOutButton";
import { StatusActions, DeleteEverything } from "@/components/MyPublicationActions";
import { ShieldIcon, PlusIcon, PlaneIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte — Dawaana" };

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold ${
        active
          ? "bg-brand-green-tint text-brand-green-dark"
          : "bg-brand-bg border border-brand-border text-brand-ink-faint"
      }`}
    >
      {label}
    </span>
  );
}

export default async function MonComptePage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-brand-ink-faint text-sm">
          {dict.account.notConfigured}
        </div>
      </div>
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");

  const supabase = createClient();
  const [{ data: listingsData }, { data: tripsData }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("trips")
      .select("*")
      .eq("user_id", profile.id)
      .order("travel_date", { ascending: false }),
  ]);

  const listings = (listingsData ?? []) as Listing[];
  const trips = (tripsData ?? []) as Trip[];
  const total = listings.length + trips.length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 flex flex-col gap-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-display font-extrabold text-[28px]">
            {t(dict.account.greeting, { name: profile.first_name })}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <VerifiedBadge verified={profile.identity_verified} locale={locale} />
            {profile.email && (
              <span className="text-xs text-brand-ink-faint">{profile.email}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.is_admin && (
            <Link
              href="/admin"
              className="h-10 px-4 rounded-xl bg-brand-ink text-white text-sm font-semibold flex items-center gap-2 hover:brightness-125 transition"
            >
              <ShieldIcon size={15} />
              {dict.account.moderation}
            </Link>
          )}
          <SignOutButton
            locale={locale}
            className="h-10 px-4 rounded-xl border border-brand-border text-sm font-semibold hover:bg-brand-bg transition"
          />
        </div>
      </header>

      {/* ---- Annonces ---- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-lg">
            {dict.account.myListings} {listings.length > 0 && `(${listings.length})`}
          </h2>
          <Link
            href="/publier"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-coral-dark"
          >
            <PlusIcon size={15} />
            {dict.account.publish}
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-7 text-center text-brand-ink-faint text-sm">
            {dict.account.noListingsYet}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <Link href={`/annonces/${l.id}`} className="font-bold hover:underline">
                      {l.medication_name}
                    </Link>
                    <div className="text-[13px] text-brand-ink-faint mt-0.5">
                      {l.type === "don" ? dict.listingCard.don : dict.listingCard.demande} ·{" "}
                      {wilayaLabel(l.wilaya, locale)} · {relativeTime(l.created_at, locale)}
                    </div>
                  </div>
                  <StatusPill label={dict.listingStatus[l.status]} active={l.status === "active"} />
                </div>
                <StatusActions table="listings" id={l.id} status={l.status} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Trajets ---- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-lg">
            {dict.account.myTrips} {trips.length > 0 && `(${trips.length})`}
          </h2>
          <Link
            href="/voyages/publier"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-dark"
          >
            <PlaneIcon size={15} />
            {dict.account.announce}
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-7 text-center text-brand-ink-faint text-sm">
            {dict.account.noTripsYet}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trips.map((t) => (
              <div
                key={t.id}
                className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <Link href={`/voyages/${t.id}`} className="font-bold hover:underline">
                      {[t.from_city, t.from_country ? countryLabel(t.from_country, locale) : null]
                        .filter(Boolean)
                        .join(", ")}{" "}
                      → {wilayaLabel(t.to_wilaya, locale)}
                    </Link>
                    <div className="text-[13px] text-brand-ink-faint mt-0.5">
                      {formatDate(t.travel_date, locale)}
                    </div>
                  </div>
                  <StatusPill label={dict.tripStatus[t.status]} active={t.status === "active"} />
                </div>
                <StatusActions table="trips" id={t.id} status={t.status} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Données ---- */}
      <section className="flex flex-col gap-4 border-t border-brand-border pt-8">
        <h2 className="font-display font-bold text-lg">{dict.account.myData}</h2>

        <div className="flex gap-3 px-4 py-4 bg-brand-surface border border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-soft leading-relaxed">
            {dict.account.myDataBody}{" "}
            <Link href="/confidentialite" className="underline underline-offset-2">
              {dict.account.dataLink}
            </Link>
            .
          </p>
        </div>

        <DeleteEverything count={total} locale={locale} />
      </section>
    </div>
  );
}
