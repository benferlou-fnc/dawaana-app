"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, Listing, ListingStatus } from "@/lib/types";
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
  CameraIcon,
  PlusIcon,
} from "@/components/icons";
import {
  type ListingType,
  type Urgency,
  type ListingCategory,
  LISTING_CATEGORIES,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { wilayaLabel, countryLabel } from "@/lib/i18n/labels";

const MAX_PRODUCT_PHOTOS = 3;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024; // 8 Mo

async function uploadListingPhoto(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File
) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

function SmallThumb({
  src,
  onRemove,
  removeLabel,
}: {
  src: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-border flex-none">
      {/* Aperçus locaux (blob:) ou distants : une balise <img> simple évite toute config d'optimiseur d'image. */}
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}

function AddPhotoTile({
  label,
  multiple,
  onChange,
}: {
  label: string;
  multiple?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="w-20 h-20 rounded-xl border-[1.5px] border-dashed border-brand-border flex flex-col items-center justify-center gap-1 text-brand-ink-faint cursor-pointer hover:bg-brand-bg transition flex-none">
      <PlusIcon size={16} />
      <span className="text-[10px] font-semibold text-center px-1">{label}</span>
      <input type="file" accept="image/*" multiple={multiple} onChange={onChange} className="hidden" />
    </label>
  );
}

export default function PublierForm({
  locale,
  mode = "create",
  listing,
}: {
  locale: Locale;
  mode?: "create" | "edit";
  listing?: Listing;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(listing);

  const [type] = useState<ListingType>(listing?.type ?? "recherche");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState<ListingCategory>(listing?.category ?? "medicament");
  const [medicationName, setMedicationName] = useState(listing?.medication_name ?? "");
  const [dosage, setDosage] = useState(listing?.dosage ?? "");
  const [quantity, setQuantity] = useState(listing?.quantity ?? "");
  const [wilaya, setWilaya] = useState(listing?.wilaya ?? "");
  const [urgency, setUrgency] = useState<Urgency>(listing?.urgency ?? "normal");
  const [expirationDate, setExpirationDate] = useState(listing?.expiration_date ?? "");
  const [arrivalDate, setArrivalDate] = useState(listing?.arrival_date ?? "");
  const [fromAbroad, setFromAbroad] = useState(Boolean(listing?.donor_country));
  const [donorCountry, setDonorCountry] = useState(listing?.donor_country ?? "");
  const [donorCity, setDonorCity] = useState(listing?.donor_city ?? "");
  const [context, setContext] = useState(listing?.context ?? "");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<ListingStatus>(listing?.status ?? "active");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Photos déjà en ligne (mode édition) — retirables sans re-téléversement.
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(listing?.photo_urls ?? []);
  const [existingExpirationPhotoUrl, setExistingExpirationPhotoUrl] = useState<string | null>(
    listing?.expiration_photo_url ?? null
  );
  // Nouveaux fichiers choisis, pas encore téléversés.
  const [productPhotos, setProductPhotos] = useState<File[]>([]);
  const [expirationPhoto, setExpirationPhoto] = useState<File | null>(null);

  const isDon = type === "don";

  const productPhotoPreviews = useMemo(
    () => productPhotos.map((f) => URL.createObjectURL(f)),
    [productPhotos]
  );
  const expirationPhotoPreview = useMemo(
    () => (expirationPhoto ? URL.createObjectURL(expirationPhoto) : null),
    [expirationPhoto]
  );
  const totalProductPhotos = existingPhotoUrls.length + productPhotos.length;

  function handleProductPhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.some((f) => f.size > MAX_PHOTO_SIZE)) {
      setErrorMsg(dict.publier.photoTooLarge);
    }
    const room = MAX_PRODUCT_PHOTOS - totalProductPhotos;
    const accepted = files.filter((f) => f.size <= MAX_PHOTO_SIZE).slice(0, Math.max(room, 0));
    setProductPhotos((prev) => [...prev, ...accepted]);
  }

  function handleExpirationPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file && file.size > MAX_PHOTO_SIZE) {
      setErrorMsg(dict.publier.photoTooLarge);
      return;
    }
    setExpirationPhoto(file);
  }

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
      setErrorMsg(dict.publier.errorNeedAccount);
      return;
    }
    if (!medicationName.trim() || !wilaya) {
      setErrorMsg(dict.publier.errorMissingFields);
      return;
    }
    if (!isEdit && !consent) {
      setErrorMsg(dict.publier.errorConsent);
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg(dict.publier.errorNotConfigured);
      return;
    }

    const abroad = isDon && fromAbroad;
    const supabase = createClient();

    setSubmitting(true);

    let newPhotoUrls: string[] = [];
    let newExpirationPhotoUrl: string | null = null;
    if (isDon && (productPhotos.length > 0 || expirationPhoto)) {
      setUploadingPhotos(true);
      try {
        newPhotoUrls = await Promise.all(
          productPhotos.map((f) => uploadListingPhoto(supabase, profile.id, f))
        );
        if (expirationPhoto) {
          newExpirationPhotoUrl = await uploadListingPhoto(supabase, profile.id, expirationPhoto);
        }
      } catch (err) {
        setUploadingPhotos(false);
        setSubmitting(false);
        setErrorMsg(dict.publier.errorPhotoUpload);
        console.error(err);
        return;
      }
      setUploadingPhotos(false);
    }

    const finalPhotoUrls = isDon
      ? [...existingPhotoUrls, ...newPhotoUrls].slice(0, MAX_PRODUCT_PHOTOS)
      : [];
    const finalExpirationPhotoUrl = isDon
      ? newExpirationPhotoUrl ?? existingExpirationPhotoUrl
      : null;

    const payload = {
      category,
      medication_name: medicationName.trim(),
      dosage: dosage.trim() || null,
      quantity: quantity.trim() || null,
      wilaya,
      urgency: isDon ? "normal" : urgency,
      context: context.trim() || null,
      donor_country: abroad && donorCountry ? donorCountry : null,
      donor_city: abroad && donorCity.trim() ? donorCity.trim() : null,
      expiration_date: isDon && expirationDate ? expirationDate : null,
      arrival_date: abroad && arrivalDate ? arrivalDate : null,
      photo_urls: finalPhotoUrls,
      expiration_photo_url: finalExpirationPhotoUrl,
    };

    if (isEdit && listing) {
      const { error } = await supabase
        .from("listings")
        .update({ ...payload, status })
        .eq("id", listing.id);

      setSubmitting(false);

      if (error) {
        setErrorMsg(dict.editListing.errorUpdateFailed);
        console.error(error);
        return;
      }

      router.refresh();
      router.push(`/annonces/${listing.id}`);
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert({
        user_id: profile.id,
        type,
        ...payload,
        first_name: profile.first_name,
        consent_at: new Date().toISOString(),
        status: "active",
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      setErrorMsg(dict.publier.errorSubmitFailed);
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
      <div className="max-w-3xl mx-auto px-6 py-14 text-sm text-brand-ink-faint">{dict.publier.loading}</div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-6 py-14 text-center flex flex-col gap-5">
        <h1 className="font-display font-extrabold text-[26px]">{dict.publier.needAccountTitle}</h1>
        <p className="text-brand-ink-soft text-sm leading-relaxed">{dict.publier.needAccountBody}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/inscription"
            className="h-12 rounded-xl bg-brand-coral text-white font-display font-semibold flex items-center justify-center"
          >
            {dict.publier.createAccount}
          </Link>
          <Link
            href="/connexion"
            className="h-12 rounded-xl border border-brand-border font-display font-semibold flex items-center justify-center"
          >
            {dict.publier.alreadyHaveAccount}
          </Link>
        </div>
      </div>
    );
  }

  const busy = submitting || uploadingPhotos;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-[28px]">
          {isEdit ? dict.editListing.title : dict.publier.title}
        </h1>
        <p className="text-brand-ink-soft text-sm mt-1">
          {isEdit ? dict.editListing.subtitle : dict.publier.subtitle}
        </p>
      </div>

      {isEdit ? (
        <div className="flex gap-2.5 p-1.5 bg-brand-surface border-[1.5px] border-brand-border rounded-2xl mb-7">
          <div
            className={`flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm ${
              isDon ? "bg-brand-green-dark text-white" : "bg-brand-coral text-white"
            }`}
          >
            {isDon ? <GiftIcon size={17} /> : <SearchIcon size={17} />}
            {isDon ? dict.publier.tabDonate : dict.publier.tabSearch}
          </div>
        </div>
      ) : (
        <div className="flex gap-2.5 p-1.5 bg-brand-surface border-[1.5px] border-brand-border rounded-2xl mb-7">
          <button
            type="button"
            disabled
            className={`flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm transition ${
              type === "recherche" ? "bg-brand-coral text-white" : "text-brand-ink-soft"
            }`}
          >
            <SearchIcon size={17} />
            {dict.publier.tabSearch}
          </button>
          <button
            type="button"
            disabled
            className={`flex-1 h-[52px] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-sm transition ${
              isDon ? "bg-brand-green-dark text-white" : "text-brand-ink-soft"
            }`}
          >
            <GiftIcon size={17} />
            {dict.publier.tabDonate}
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface border border-brand-border rounded-[20px] p-8 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-brand-bg rounded-xl">
          <span className="text-[13.5px] text-brand-ink-soft">
            {dict.publier.publishedAs} <strong className="text-brand-ink">{profile.first_name}</strong>
          </span>
          <Link
            href="/mon-compte"
            className="text-xs font-semibold text-brand-ink-soft underline underline-offset-2 whitespace-nowrap"
          >
            {dict.publier.myAccount}
          </Link>
        </div>

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">
            <span className="inline-flex items-center gap-1.5">
              <TagIcon size={13} />
              {dict.publier.category}
            </span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategory)}
            className={field}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {dict.categories[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">
            {dict.publier.productName}
            {category === "medicament" ? dict.publier.productNameDci : ""}
          </label>
          <input
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder={dict.categoryExamples[category]}
            className={field}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {category === "medicament" ? dict.publier.dosageOrForm : dict.publier.referenceOrFeature}
            </label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder={category === "medicament" ? dict.publier.dosageExample : dict.publier.referenceExample}
              className={field}
            />
          </div>
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {isDon ? dict.publier.quantityAvailable : dict.publier.quantityWanted}
            </label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={dict.publier.quantityExample}
              className={field}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">
              {isDon ? dict.publier.wilayaHandoff : dict.publier.wilaya}
            </label>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className={field}
            >
              <option value="">{dict.publier.selectWilaya}</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {wilayaLabel(w, locale)}
                </option>
              ))}
            </select>
          </div>
          {isDon ? (
            <div>
              <label className="block text-[13.5px] font-semibold mb-2">
                {dict.publier.expirationDate} {category !== "medicament" && dict.publier.expirationIfApplicable}
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
              <label className="block text-[13.5px] font-semibold mb-2">{dict.publier.urgencyLevel}</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className={field}
              >
                <option value="normal">{dict.publier.normal}</option>
                <option value="urgent">{dict.publier.urgent}</option>
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
              {dict.publier.abroadCheckbox}
            </label>

            {fromAbroad && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                      {dict.publier.country}
                    </label>
                    <select
                      value={donorCountry}
                      onChange={(e) => setDonorCountry(e.target.value)}
                      className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
                    >
                      <option value="">{dict.publier.selectCountry}</option>
                      {DIASPORA_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {countryLabel(c, locale)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                      {dict.publier.cityOptional}
                    </label>
                    <input
                      value={donorCity}
                      onChange={(e) => setDonorCity(e.target.value)}
                      placeholder={dict.publier.cityPlaceholder}
                      className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[13.5px] font-semibold mb-2 text-brand-green-dark">
                    <PlaneIcon size={16} />
                    {dict.publier.flightDate}
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none bg-white"
                  />
                  <p className="text-xs text-brand-green-dark/80 leading-relaxed mt-2">
                    {dict.publier.flightDateHelp}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {isDon && (
          <div className="rounded-2xl border-[1.5px] border-dashed border-brand-border px-5 py-4.5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[13.5px] font-bold">
              <CameraIcon size={17} />
              {dict.publier.photosTitle}
            </div>
            <p className="text-xs text-brand-ink-faint -mt-2.5">{dict.publier.photosHelp}</p>

            <div>
              <label className="block text-[13.5px] font-semibold mb-2">
                {dict.publier.productPhotos}{" "}
                <span className="text-brand-ink-faint font-normal">{dict.publier.photosOptional}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {existingPhotoUrls.map((url, i) => (
                  <SmallThumb
                    key={`existing-${url}`}
                    src={url}
                    removeLabel={dict.publier.removePhoto}
                    onRemove={() => setExistingPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
                {productPhotoPreviews.map((url, i) => (
                  <SmallThumb
                    key={`new-${i}`}
                    src={url}
                    removeLabel={dict.publier.removePhoto}
                    onRemove={() => setProductPhotos((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
                {totalProductPhotos < MAX_PRODUCT_PHOTOS && (
                  <AddPhotoTile label={dict.publier.addPhoto} multiple onChange={handleProductPhotosChange} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold mb-2">
                {dict.publier.expirationPhoto}{" "}
                <span className="text-brand-ink-faint font-normal">{dict.publier.photosOptional}</span>
              </label>
              <div className="flex gap-3">
                {expirationPhotoPreview ? (
                  <SmallThumb
                    src={expirationPhotoPreview}
                    removeLabel={dict.publier.removePhoto}
                    onRemove={() => setExpirationPhoto(null)}
                  />
                ) : existingExpirationPhotoUrl ? (
                  <SmallThumb
                    src={existingExpirationPhotoUrl}
                    removeLabel={dict.publier.removePhoto}
                    onRemove={() => setExistingExpirationPhotoUrl(null)}
                  />
                ) : (
                  <AddPhotoTile label={dict.publier.addPhoto} onChange={handleExpirationPhotoChange} />
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[13.5px] font-semibold mb-2">{dict.publier.context}</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder={dict.publier.contextPlaceholder}
            className="w-full rounded-xl border-[1.5px] border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-green resize-none"
          />
        </div>

        {isEdit && (
          <div>
            <label className="block text-[13.5px] font-semibold mb-2">{dict.editListing.statusLabel}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ListingStatus)}
              className={field}
            >
              <option value="active">{dict.listingStatus.active}</option>
              <option value="resolue">{dict.listingStatus.resolue}</option>
              <option value="retiree">{dict.listingStatus.retiree}</option>
            </select>
          </div>
        )}

        {!isEdit && (
          <label className="flex gap-3 px-4 py-3.5 bg-brand-bg rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="accent-brand-green-dark mt-0.5 flex-none"
            />
            <span className="text-xs text-brand-ink-soft leading-relaxed">
              {dict.publier.consentLabel}{" "}
              <Link href="/confidentialite" className="underline underline-offset-2">
                {dict.publier.dataInfoLink}
              </Link>
            </span>
          </label>
        )}

        <div className="flex gap-3 px-4 py-4 border-[1.5px] border-dashed border-brand-border rounded-xl">
          <ShieldIcon size={18} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">{dict.publier.disclaimerBody}</p>
        </div>

        {errorMsg && (
          <div className="text-sm text-brand-coral-dark bg-brand-coral-tint rounded-xl px-4 py-3">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          {isEdit && listing && (
            <Link
              href={`/annonces/${listing.id}`}
              className="h-[54px] px-6 rounded-xl border border-brand-border font-display font-semibold text-sm flex items-center justify-center"
            >
              {dict.editListing.cancel}
            </Link>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex-1 h-[54px] rounded-xl bg-brand-coral text-white font-display font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploadingPhotos
              ? dict.publier.uploadingPhotos
              : submitting
              ? isEdit
                ? dict.editListing.saving
                : dict.publier.submitting
              : isEdit
              ? dict.editListing.save
              : isDon
              ? dict.publier.submitDonate
              : dict.publier.submitRequest}
            {!busy && <ArrowRightIcon className="rtl:-scale-x-100" />}
          </button>
        </div>
      </form>
    </div>
  );
}
