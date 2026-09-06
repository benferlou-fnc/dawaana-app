import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type Listing, type Trip, type Profile } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/relativeTime";
import { ModerateActions, VerifyToggle } from "@/components/AdminActions";
import { ShieldIcon, GlobeIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modération — Dawaana", robots: { index: false } };

type Filter = "toutes" | "active" | "resolue" | "retiree";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-ink-faint">
        {label}
      </span>
      <span
        className={`font-display font-bold text-2xl tabular-nums ${
          tone === "alert" && value > 0 ? "text-brand-coral-dark" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Pill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
        active
          ? "bg-brand-green-tint text-brand-green-dark"
          : "bg-brand-bg border border-brand-border text-brand-ink-faint"
      }`}
    >
      {label}
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { statut?: string };
}) {
  const locale = getLocale();
  const dict = getDictionary(locale);

  if (!isSupabaseConfigured) notFound();

  const me = await getCurrentProfile();
  // Page introuvable plutôt qu'« accès refusé » : inutile de signaler
  // l'existence d'une console de modération à qui n'y a pas droit.
  if (!me?.is_admin) notFound();

  const filter = (["active", "resolue", "retiree"].includes(searchParams.statut ?? "")
    ? searchParams.statut
    : "toutes") as Filter;

  const supabase = createClient();

  let listingQuery = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "toutes") listingQuery = listingQuery.eq("status", filter);

  const [{ data: listingsData }, { data: tripsData }, { data: profilesData }] =
    await Promise.all([
      listingQuery,
      supabase.from("trips").select("*").order("travel_date", { ascending: false }).limit(100),
      supabase
        .from("profiles")
        .select("id, first_name, identity_verified, is_admin, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const listings = (listingsData ?? []) as Listing[];
  const trips = (tripsData ?? []) as Trip[];
  const members = (profilesData ?? []) as Profile[];

  const urgentActifs = listings.filter(
    (l) => l.status === "active" && l.urgency === "urgent" && l.type === "recherche"
  ).length;
  const nonVerifies = members.filter((m) => !m.identity_verified).length;

  const filters: { key: Filter; label: string }[] = [
    { key: "toutes", label: dict.admin.filterAll },
    { key: "active", label: dict.admin.filterActive },
    { key: "resolue", label: dict.admin.filterResolved },
    { key: "retiree", label: dict.admin.filterRemoved },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 w-fit rounded-full bg-brand-ink text-white text-[11px] font-bold px-3 h-6">
          <ShieldIcon size={12} />
          {dict.account.moderation}
        </span>
        <h1 className="font-display font-extrabold text-[28px]">{dict.admin.title}</h1>
        <p className="text-brand-ink-soft text-sm">
          {t(dict.admin.connectedAs, { name: me.first_name })}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={dict.admin.statListings} value={listings.length} />
        <Stat label={dict.admin.statUrgentRequests} value={urgentActifs} tone="alert" />
        <Stat label={dict.admin.statTrips} value={trips.length} />
        <Stat label={dict.admin.statMembers} value={members.length} />
      </section>

      {/* ---------- Annonces ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-bold text-lg">{dict.admin.listingsTitle}</h2>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={f.key === "toutes" ? "/admin" : `/admin?statut=${f.key}`}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center transition ${
                  filter === f.key
                    ? "bg-brand-ink text-white"
                    : "border border-brand-border text-brand-ink-soft hover:bg-brand-bg"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center text-brand-ink-faint text-sm">
            {dict.admin.noListingsForFilter}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/annonces/${l.id}`} className="font-bold hover:underline">
                        {l.medication_name}
                      </Link>
                      {l.type === "recherche" && l.urgency === "urgent" && (
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-brand-coral-tint text-brand-coral-dark">
                          {dict.listingCard.urgent}
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-brand-ink-faint mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span>{l.type === "don" ? dict.listingCard.don : dict.listingCard.demande}</span>
                      <span>·</span>
                      <span>{dict.categories[l.category] ?? dict.categories.medicament}</span>
                      <span>·</span>
                      <span>{wilayaLabel(l.wilaya, locale)}</span>
                      <span>·</span>
                      <span>{l.first_name ?? l.pseudonym ?? "—"}</span>
                      <span>·</span>
                      <span>{relativeTime(l.created_at, locale)}</span>
                      {l.donor_country && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <GlobeIcon size={12} />
                            {[l.donor_city, countryLabel(l.donor_country, locale)].filter(Boolean).join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                    {l.context && (
                      <p className="text-xs italic text-brand-ink-soft mt-1.5 line-clamp-2">
                        « {l.context} »
                      </p>
                    )}
                  </div>
                  <Pill label={dict.listingStatus[l.status]} active={l.status === "active"} />
                </div>
                <ModerateActions table="listings" id={l.id} status={l.status} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Trajets ---------- */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-bold text-lg">{dict.admin.tripsTitle}</h2>
        {trips.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center text-brand-ink-faint text-sm">
            {dict.admin.noTripsAnnounced}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {trips.map((t2) => (
              <div
                key={t2.id}
                className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <Link href={`/voyages/${t2.id}`} className="font-bold hover:underline">
                      {[t2.from_city, t2.from_country ? countryLabel(t2.from_country, locale) : null]
                        .filter(Boolean)
                        .join(", ")}{" "}
                      → {wilayaLabel(t2.to_wilaya, locale)}
                    </Link>
                    <div className="text-[12.5px] text-brand-ink-faint mt-0.5">
                      {formatDate(t2.travel_date, locale)} · {t2.first_name}
                    </div>
                  </div>
                  <Pill label={dict.tripStatus[t2.status]} active={t2.status === "active"} />
                </div>
                <ModerateActions table="trips" id={t2.id} status={t2.status} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Membres ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-bold text-lg">{dict.admin.membersTitle}</h2>
          <span className="text-xs text-brand-ink-faint">
            {t(dict.admin.pendingVerification, { n: nonVerifies })}
          </span>
        </div>

        <div className="flex gap-3 px-4 py-3.5 bg-brand-surface border border-brand-border rounded-xl">
          <ShieldIcon size={17} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-soft leading-relaxed">{dict.admin.verifyNoteBody}</p>
        </div>

        {members.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center text-brand-ink-faint text-sm">
            {dict.admin.noMembers}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-brand-green-tint text-brand-green-dark font-display font-bold text-sm flex items-center justify-center flex-none">
                    {m.first_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {m.first_name}
                      {m.is_admin && (
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-brand-ink text-white">
                          {dict.admin.adminBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-brand-ink-faint">
                      {m.identity_verified ? dict.admin.verified : dict.admin.notVerified}
                      {m.created_at && ` · ${dict.admin.registeredSince} ${relativeTime(m.created_at, locale)}`}
                    </div>
                  </div>
                </div>
                <VerifyToggle profileId={m.id} verified={m.identity_verified} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
