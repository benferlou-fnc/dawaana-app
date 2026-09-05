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

export default function PublierVoyagePage() {
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
      setErrorMsg("Vous devez être connecté pour annoncer un trajet.");
      return;
    }
    if (!fromCountry || !toWilaya || !travelDate) {
      setErrorMsg(
        "Merci de renseigner le pays de départ, la wilaya d'arrivée et la date."
      );
      return;
    }
    if (!consent) {
      setErrorMsg("Merci de confirmer que vous acceptez la publication de ces informations.");
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg(
        "La base de données n'est pas encore connectée sur cet environnement."
      );
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
      setErrorMsg("La publication a échoué. Merci de réessayer dans un instant.");
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
      <div className="max-w-3xl mx-auto px-6 py-14 text-sm text-brand-ink-faint">
        Chargement…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-6 py-14 text-center flex flex-col gap-5">
        <h1 className="font-display font-extrabold text-[26px]">
          Connectez-vous pour annoncer un trajet
        </h1>
        <p className="text-brand-ink-soft text-sm leading-relaxed">
          Un compte vous permettra de retirer votre trajet une fois le voyage
          passé.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/inscription"
            className="h-12 rounded-xl bg-brand-green-dark text-white font-display font-semibold flex items-center justify-center"
          >
            Créer un compte
          </Link>
          <Link
            href="/connexion"
            className="h-12 rounded-xl border border-brand-border font-display font-semibold flex items-center justify-center"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-[28px]">J&apos;annonce mon trajet</h1>
        <p className="text-brand-ink-soft text-sm mt-1">
          Indiquez seulement d&apos;où vous partez, où vous arrivez et quand.
          Aucune coordonnée n&apos;est publiée.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface border border-brand-border rounded-[20px] p-8 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-brand-bg rounded-xl">
          <span className="text-[13.5px] text-brand-ink-soft">
            Publié sous le prénom <strong className="text-brand-ink">{profile.first_name}</strong>
          </span>
          <Link
            href="/mon-compte"
            className="text-xs font-semibold text-brand-ink-soft underline underline-offset-2 whitespace-nowrap"
          >
            Mon compte
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">Pays de départ</label>
            <select
              value={fromCountry}
              onChange={(e) => setFromCountry(e.target.value)}
              className={field}
            >
              <option value="">Sélectionner un pays</option>
              {DIASPORA_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              Ville de départ (facultatif)
            </label>
            <input
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder="ex. Lyon"
              className={field}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">Wilaya d&apos;arrivée</label>
            <select
              value={toWilaya}
              onChange={(e) => setToWilaya(e.target.value)}
              className={field}
            >
              <option value="">Sélectionner une wilaya</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">Date d&apos;arrivée</label>
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
            Ce que vous pouvez faire sur place
          </div>
          <input
            value={capacityNote}
            onChange={(e) => setCapacityNote(e.target.value)}
            placeholder="ex. Je peux rencontrer quelqu'un à Oran centre la semaine de mon arrivée"
            className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
          />
          <p className="text-xs text-brand-green-dark/80 leading-relaxed">
            Décrivez une disponibilité, pas un service de transport : un
            médicament doit voyager au nom et avec l&apos;ordonnance de la
            personne qui le porte.
          </p>
        </div>

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">
            Précisions (facultatif)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Toute précision utile — sans information médicale ni coordonnées personnelles."
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
            J&apos;accepte que mon prénom, mon trajet et ma date de voyage soient
            publiés sur Dawaana, et je comprends que je peux demander leur
            suppression à tout moment.{" "}
            <Link href="/confidentialite" className="underline underline-offset-2">
              Informations sur les données
            </Link>
          </span>
        </label>

        <div className="flex gap-3 px-4 py-4 border-[1.5px] border-dashed border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">
            Dawaana ne fait ni vente, ni envoi postal, ni transport de médicaments
            pour le compte d&apos;autrui. Annoncer un trajet sert uniquement à
            faire savoir que vous serez sur place.
          </p>
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
          {submitting ? "Publication…" : "Publier mon trajet"}
          {!submitting && <ArrowRightIcon />}
        </button>
      </form>
    </div>
  );
}
