"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/types";
import { WILAYAS } from "@/lib/wilayas";
import { DIASPORA_COUNTRIES } from "@/lib/countries";
import {
  SearchIcon,
  GiftIcon,
  ShieldIcon,
  PlaneIcon,
  GlobeIcon,
  TagIcon,
  ArrowRightIcon,
} from "@/components/icons";
import {
  type ListingType,
  type Urgency,
  type ListingCategory,
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABEL,
  LISTING_CATEGORY_EXAMPLE,
} from "@/lib/types";

export default function PublierPage() {
  const router = useRouter();
  const [type, setType] = useState<ListingType>("recherche");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState<ListingCategory>("medicament");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [expirationDate, setExpirationDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [fromAbroad, setFromAbroad] = useState(false);
  const [donorCountry, setDonorCountry] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDon = type === "don";

  // Une publication doit appartenir à quelqu'un : sans compte, son auteur ne
  // pourrait plus jamais la retirer.
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
      setErrorMsg("Vous devez être connecté pour publier.");
      return;
    }
    if (!medicationName.trim() || !wilaya) {
      setErrorMsg("Merci de renseigner le nom du produit et la wilaya.");
      return;
    }
    if (!consent) {
      setErrorMsg("Merci de confirmer que vous acceptez la publication de ces informations.");
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg(
        "La base de données n'est pas encore connectée sur cet environnement — configurez les variables Supabase pour activer la publication."
      );
      return;
    }

    const abroad = isDon && fromAbroad;

    setSubmitting(true);
    const { data, error } = await createClient()
      .from("listings")
      .insert({
        user_id: profile.id,
        type,
        category,
        medication_name: medicationName.trim(),
        dosage: dosage.trim() || null,
        quantity: quantity.trim() || null,
        wilaya,
        urgency: isDon ? "normal" : urgency,
        context: context.trim() || null,
        first_name: profile.first_name,
        donor_country: abroad && donorCountry ? donorCountry : null,
        donor_city: abroad && donorCity.trim() ? donorCity.trim() : null,
        expiration_date: isDon && expirationDate ? expirationDate : null,
        arrival_date: abroad && arrivalDate ? arrivalDate : null,
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

    // Vide le cache de navigation du navigateur, sinon la liste des annonces
    // continuerait d'afficher la version d'avant la publication.
    router.refresh();
    router.push(`/annonces/${data.id}`);
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
          Connectez-vous pour publier
        </h1>
        <p className="text-brand-ink-soft text-sm leading-relaxed">
          Un compte est nécessaire pour publier une annonce — c&apos;est ce qui
          vous permettra ensuite de la retirer vous-même, dès que vous
          n&apos;en aurez plus besoin.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/inscription"
            className="h-12 rounded-xl bg-brand-coral text-white font-display font-semibold flex items-center justify-center"
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
        <h1 className="font-display font-extrabold text-[28px]">Publier une annonce</h1>
        <p className="text-brand-ink-soft text-sm mt-1">
          Deux minutes suffisent. Seul votre prénom est publié.
        </p>
      </div>

      <div className="flex gap-2.5 p-1.5 bg-brand-surface border-[1.5px] border-brand-border rounded-2xl mb-7">
        <button
          type="button"
          onClick={() => setType("recherche")}
          className={`flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm transition ${
            type === "recherche" ? "bg-brand-coral text-white" : "text-brand-ink-soft"
          }`}
        >
          <SearchIcon size={17} />
          Je cherche un produit
        </button>
        <button
          type="button"
          onClick={() => setType("don")}
          className={`flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm transition ${
            isDon ? "bg-brand-green-dark text-white" : "text-brand-ink-soft"
          }`}
        >
          <GiftIcon size={17} />
          J&apos;ai un produit à donner
        </button>
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

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">
            <span className="inline-flex items-center gap-1.5">
              <TagIcon size={13} />
              Catégorie
            </span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategory)}
            className={field}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LISTING_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">
            Nom du produit{category === "medicament" ? " (DCI de préférence)" : ""}
          </label>
          <input
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder={LISTING_CATEGORY_EXAMPLE[category]}
            className={field}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {category === "medicament" ? "Dosage / forme" : "Référence / caractéristique"}
            </label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder={category === "medicament" ? "ex. 100 UI/ml, stylo" : "ex. taille M, modèle standard…"}
              className={field}
            />
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {isDon ? "Quantité disponible" : "Quantité recherchée"}
            </label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ex. 2 stylos"
              className={field}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {isDon ? "Wilaya de remise" : "Wilaya"}
            </label>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
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
          {isDon ? (
            <div>
              <label className="block text-[13.5px] font-semibold mb-2">
                Date de péremption {category !== "medicament" && "(si applicable)"}
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className={field}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[13.5px] font-semibold mb-2">Niveau d&apos;urgence</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className={field}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          )}
        </div>

        {isDon && (
          <div className="rounded-2xl bg-brand-green-tint px-5 py-4.5 flex flex-col gap-4">
            <label className="flex items-center gap-2.5 text-brand-green-dark font-bold text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={fromAbroad}
                onChange={(e) => setFromAbroad(e.target.checked)}
                className="accent-brand-green-dark"
              />
              <GlobeIcon size={17} />
              Je me trouve à l&apos;étranger
            </label>

            {fromAbroad && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                      Pays
                    </label>
                    <select
                      value={donorCountry}
                      onChange={(e) => setDonorCountry(e.target.value)}
                      className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
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
                    <label className="block text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                      Ville (facultatif)
                    </label>
                    <input
                      value={donorCity}
                      onChange={(e) => setDonorCity(e.target.value)}
                      placeholder="ex. Marseille"
                      className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                    <PlaneIcon size={16} />
                    Date de vol / arrivée en Algérie (facultatif)
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
                  />
                  <p className="text-xs text-brand-green-dark/80 leading-relaxed mt-2">
                    Savoir qu&apos;un produit arrive dans quelques jours permet
                    aux patients qui en ont besoin de s&apos;organiser à
                    l&apos;avance.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">Contexte (facultatif)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Toute précision utile pour un pharmacien bénévole — jamais d'information médicale identifiante requise."
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
            J&apos;accepte que mon prénom et le contenu de cette annonce soient
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
            Dawaana est un espace de solidarité, pas une pharmacie en ligne.
            Aucune vente n&apos;est autorisée, aucun envoi postal de produits
            non plus. La remise se fait en main propre, et les dons venant de
            l&apos;étranger doivent respecter la réglementation douanière.
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
          className="w-full h-[54px] rounded-xl bg-brand-coral text-white font-display font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? "Publication…" : isDon ? "Publier mon don" : "Publier ma demande"}
          {!submitting && <ArrowRightIcon />}
        </button>
      </form>
    </div>
  );
}
