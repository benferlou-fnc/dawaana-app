import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { displayName, donorLocation, isVerified, type Listing } from "@/lib/types";
import { relativeTime } from "@/lib/relativeTime";
import PharmacistActions from "@/components/PharmacistActions";
import VerifiedBadge from "@/components/VerifiedBadge";
import MedicationVerifiedBadge from "@/components/MedicationVerifiedBadge";
import { PillIcon, GlobeIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contrôle du médicament — Dawaana", robots: { index: false } };

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

export default async function PharmacienPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  if (!isSupabaseConfigured) notFound();

  const me = await getCurrentProfile();
  // Page introuvable plutôt qu'« accès refusé » : inutile de signaler
  // l'existence de cette console à qui n'y a pas droit.
  if (!me?.is_pharmacist) notFound();

  const supabase = createClient();
  const { data: listingsData } = await supabase
    .from("listings")
    .select("*, profiles(first_name, identity_verified)")
    .eq("status", "active")
    .eq("type", "don")
    .order("created_at", { ascending: false })
    .limit(100);

  const dons = (listingsData ?? []) as Listing[];
  const aControler = dons.filter((l) => !l.medication_verified).length;
  const controles = dons.length - aControler;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 w-fit rounded-full bg-brand-ink text-white text-[11px] font-bold px-3 h-6">
          <PillIcon size={12} />
          {dict.account.pharmacistAccess}
        </span>
        <h1 className="font-display font-extrabold text-[28px]">{dict.pharmacien.title}</h1>
        <p className="text-brand-ink-soft text-sm">
          {t(dict.pharmacien.connectedAs, { name: me.first_name })}
        </p>
      </header>

      <div className="flex gap-3 px-4 py-3.5 bg-brand-surface border border-brand-border rounded-xl">
        <PillIcon size={17} className="text-brand-ink-faint flex-none mt-0.5" />
        <p className="text-xs text-brand-ink-soft leading-relaxed">{dict.pharmacien.noteBody}</p>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <Stat label={dict.pharmacien.statToControl} value={aControler} tone="alert" />
        <Stat label={dict.pharmacien.statControlled} value={controles} />
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
              const location = donorLocation(l);
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
                              {countryLabel(location, locale)}
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
                  <PharmacistActions listingId={l.id} verified={l.medication_verified} locale={locale} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
