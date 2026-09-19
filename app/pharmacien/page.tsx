import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { displayName, isVerified, LISTING_SELECT, type Listing } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/relativeTime";
import PharmacistActions from "@/components/PharmacistActions";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import VerifiedBadge from "@/components/VerifiedBadge";
import MedicationVerifiedBadge from "@/components/MedicationVerifiedBadge";
import { PillIcon, GlobeIcon, ShieldCheckIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, placeLabel } from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tableau de bord pharmacien — Dawaana", robots: { index: false } };

function Stat({ label, value, tone }: { label: string; value: number; tone?: "alert" | "positive" }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-ink-faint">
        {label}
      </span>
      <span
        className={`font-display font-bold text-2xl tabular-nums ${
          tone === "alert" && value > 0
            ? "text-brand-coral-dark"
            : tone === "positive" && value > 0
            ? "text-brand-green-dark"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default async function PharmacienPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  if (!isSupabaseConfigured) notFound();

  const me = await getCurrentProfile();
  // Page introuvable plutôt qu'« accès refusé » : inutile de signaler
  // l'existence de cette console à qui n'y a pas droit.
  if (!me?.is_pharmacist) notFound();

  const supabase = createClient();
  const [{ data: listingsData }, { data: historyData }] = await Promise.all([
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .eq("type", "don")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("medication_verified_by", me.id)
      .order("medication_verified_at", { ascending: false })
      .limit(100),
  ]);

  const dons = (listingsData ?? []) as Listing[];
  const history = (historyData ?? []) as Listing[];
  const aControler = dons.filter((l) => !l.medication_verified).length;
  const controles = dons.length - aControler;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 w-fit rounded-full bg-brand-ink text-white text-[11px] font-bold px-3 h-6">
            <PillIcon size={12} />
            {dict.pharmacien.profileBadge}
          </span>
          <h1 className="font-display font-extrabold text-[28px]">{dict.pharmacien.title}</h1>
          <p className="text-brand-ink-soft text-sm">
            {t(dict.pharmacien.connectedAs, { name: me.first_name })}
            {me.created_at && (
              <span className="text-brand-ink-faint">
                {" · "}
                {t(dict.pharmacien.memberSince, { date: formatDate(me.created_at, locale) })}
              </span>
            )}
          </p>
        </div>
        <PushNotificationToggle locale={locale} />
      </header>

      <div className="flex gap-3 px-4 py-3.5 bg-brand-surface border border-brand-border rounded-xl">
        <PillIcon size={17} className="text-brand-ink-faint flex-none mt-0.5" />
        <p className="text-xs text-brand-ink-soft leading-relaxed">{dict.pharmacien.noteBody}</p>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <Stat label={dict.pharmacien.statToControl} value={aControler} tone="alert" />
        <Stat label={dict.pharmacien.statControlled} value={controles} />
        <Stat label={dict.pharmacien.statMine} value={history.length} tone="positive" />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display font-bold text-lg">{dict.pharmacien.donsTitle}</h2>

        {dons.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center text-brand-ink-faint text-sm">
            {dict.pharmacien.noDons}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dons.map((l) => {
              const location = placeLabel(l, locale);
              return (
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
                        <MedicationVerifiedBadge verified={l.medication_verified} locale={locale} />
                      </div>
                      <div className="text-[12.5px] text-brand-ink-faint mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>{dict.categories[l.category] ?? dict.categories.medicament}</span>
                        {(l.dosage || l.quantity) && <span>·</span>}
                        <span>{[l.dosage, l.quantity].filter(Boolean).join(" · ")}</span>
                        <span>·</span>
                        <span>{wilayaLabel(l.wilaya, locale)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          {displayName(l)}
                          <VerifiedBadge verified={isVerified(l)} locale={locale} />
                        </span>
                        <span>·</span>
                        <span>{relativeTime(l.created_at, locale)}</span>
                        {location && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <GlobeIcon size={12} />
                              {location}
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
                  </div>

                  {(l.photo_urls?.length > 0 || l.expiration_photo_url) && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {l.photo_urls?.length > 0 && (
                        <div>
                          <div className="text-[10.5px] text-brand-ink-faint mb-1.5">
                            {dict.annonceDetail.productPhotosTitle}
                          </div>
                          <div className="flex gap-2">
                            {l.photo_urls.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={url}
                                  alt=""
                                  className="w-16 h-16 rounded-lg object-cover border border-brand-border"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {l.expiration_photo_url && (
                        <div>
                          <div className="text-[10.5px] text-brand-ink-faint mb-1.5">
                            {dict.annonceDetail.expirationPhotoTitle}
                          </div>
                          <a href={l.expiration_photo_url} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={l.expiration_photo_url}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover border border-brand-border"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <PharmacistActions listingId={l.id} verified={l.medication_verified} locale={locale} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-brand-border pt-8">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <ShieldCheckIcon size={18} className="text-brand-green-dark" />
          {dict.pharmacien.historyTitle}
        </h2>

        {history.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center text-brand-ink-faint text-sm">
            {dict.pharmacien.noHistory}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((l) => (
              <div
                key={l.id}
                className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  <Link href={`/annonces/${l.id}`} className="font-bold hover:underline">
                    {l.medication_name}
                  </Link>
                  <div className="text-[12px] text-brand-ink-faint mt-0.5">
                    {wilayaLabel(l.wilaya, locale)} · {displayName(l)}
                  </div>
                </div>
                <span className="text-[11px] text-brand-green-dark font-semibold flex-none">
                  {dict.pharmacien.controlledOn}
                  {l.medication_verified_at && ` · ${relativeTime(l.medication_verified_at, locale)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
