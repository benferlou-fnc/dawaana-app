"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/types";
import { WILAYAS } from "@/lib/wilayas";
import { DIASPORA_COUNTRIES } from "@/lib/countries";
import { PlaneIcon, ShieldIcon, ArrowRightIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

export default function PublierVoyageForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [fromCountry, setFromCountry] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toWilaya, setToWilaya] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [capacityNote, setCapacityNote] = useState("");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setCheckingAuth(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, identity_verified")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((data as Profile) ?? null);
      setCheckingAuth(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!profile) {
      setErrorMsg(dict.voyagesPublier.errorNeedAccount);
      return;
    }
    if (!fromCountry || !toWilaya || !travelDate) {
      setErrorMsg(dict.voyagesPublier.errorMissingFields);
      return;
    }
    if (!consent) {
      setErrorMsg(dict.voyagesPublier.errorConsent);
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg(dict.voyagesPublier.errorNotConfigured);
      return;
    }

    setSubmitting(true);
    const { data, error } = await createClient()
      .from("trips")
      .insert({
        user_id: profile.id,
        first_name: profile.first_name,
        from_country: fromCountry,
        from_city: fromCity.trim() || null,
        to_wilaya: toWilaya,
        travel_date: travelDate,
        capacity_note: capacityNote.trim() || null,
        context: context.trim() || null,
        consent_at: new Date().toISOString(),
        status: "active",
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setErrorMsg(dict.voyagesPublier.errorSubmitFailed);
      console.error(error);
      return;
    }

    router.refresh();
    router.push(`/voyages/${data.id}`);
  }

  const field =
    "w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none focus:border-brand-green";

  if (checkingAuth) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-14 text-sm text-brand-ink-faint">{dict.voyagesPublier.loading}</div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-6 py-14 text-center flex flex-col gap-5">
        <h1 className="font-display font-extrabold text-[26px]">{dict.voyagesPublier.needAccountTitle}</h1>
        <p className="text-brand-ink-soft text-sm leading-relaxed">{dict.voyagesPublier.needAccountBody}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/inscription"
            className="h-12 rounded-xl bg-brand-green-dark text-white font-display font-semibold flex items-center justify-center"
          >
            {dict.voyagesPublier.createAccount}
          </Link>
          <Link
            href="/connexion"
            className="h-12 rounded-xl border border-brand-border font-display font-semibold flex items-center justify-center"
          >
            {dict.voyagesPublier.alreadyHaveAccount}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-[28px]">{dict.voyagesPublier.title}</h1>
        <p className="text-brand-ink-soft text-sm mt-1">{dict.voyagesPublier.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface border border-brand-border rounded-[20px] p-8 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-brand-bg rounded-xl">
          <span className="text-[13.5px] text-brand-ink-soft">
            {dict.voyagesPublier.publishedAs} <strong className="text-brand-ink">{profile.first_name}</strong>
          </span>
          <Link
            href="/mon-compte"
            className="text-xs font-semibold text-brand-ink-soft underline underline-offset-2 whitespace-nowrap"
          >
            {dict.voyagesPublier.myAccount}
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">{dict.voyagesPublier.fromCountry}</label>
            <select
              value={fromCountry}
              onChange={(e) => setFromCountry(e.target.value)}
              className={field}
            >
              <option value="">{dict.voyagesPublier.selectCountry}</option>
              {DIASPORA_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {countryLabel(c, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">{dict.voyagesPublier.fromCityOptional}</label>
            <input
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder={dict.voyagesPublier.fromCityPlaceholder}
              className={field}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">{dict.voyagesPublier.toWilaya}</label>
            <select
              value={toWilaya}
              onChange={(e) => setToWilaya(e.target.value)}
              className={field}
            >
              <option value="">{dict.voyagesPublier.selectWilaya}</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {wilayaLabel(w, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">{dict.voyagesPublier.arrivalDate}</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-brand-green-tint px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-brand-green-dark font-bold text-[13.5px]">
            <PlaneIcon size={18} />
            {dict.voyagesPublier.whatYouCanDo}
          </div>
          <input
            value={capacityNote}
            onChange={(e) => setCapacityNote(e.target.value)}
            placeholder={dict.voyagesPublier.capacityPlaceholder}
            className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
          />
          <p className="text-xs text-brand-green-dark/80 leading-relaxed">{dict.voyagesPublier.capacityHelp}</p>
        </div>

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">{dict.voyagesPublier.precisionsOptional}</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder={dict.voyagesPublier.precisionsPlaceholder}
            className="w-full rounded-xl border-[1.5px] border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-green resize-none"
          />
        </div>

        <label className="flex gap-3 px-4 py-3.5 bg-brand-bg rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="accent-brand-green-dark mt-0.5 flex-none"
          />
          <span className="text-xs text-brand-ink-soft leading-relaxed">
            {dict.voyagesPublier.consentLabel}{" "}
            <Link href="/confidentialite" className="underline underline-offset-2">
              {dict.voyagesPublier.dataInfoLink}
            </Link>
          </span>
        </label>

        <div className="flex gap-3 px-4 py-4 border-[1.5px] border-dashed border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">{dict.voyagesPublier.disclaimerBody}</p>
        </div>

        {errorMsg && (
          <div className="text-sm text-brand-coral-dark bg-brand-coral-tint rounded-xl px-4 py-3">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-[54px] rounded-xl bg-brand-green-dark text-white font-display font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? dict.voyagesPublier.submitting : dict.voyagesPublier.submit}
          {!submitting && <ArrowRightIcon className="rtl:-scale-x-100" />}
        </button>
      </form>
    </div>
  );
}
