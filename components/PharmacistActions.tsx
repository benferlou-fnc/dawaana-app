"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Pose ou retire le badge « médicament contrôlé ».
 * Passe par une fonction en base : la colonne elle-même est interdite en
 * écriture, y compris à l'auteur de l'annonce — seul un compte pharmacien
 * peut appeler cette fonction, et elle le revérifie côté serveur.
 */
export default function PharmacistActions({
  listingId,
  verified,
  locale,
}: {
  listingId: string;
  verified: boolean;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setErrorMsg(null);
    const { error } = await createClient().rpc("pharmacist_set_medication_verified", {
      target_id: listingId,
      verified: !verified,
    });
    setBusy(false);
    if (error) {
      setErrorMsg(dict.pharmacien.actionRefused);
      console.error(error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className={`h-8 px-3 rounded-lg text-[11px] font-semibold border transition disabled:opacity-50 ${
          verified
            ? "border-brand-border hover:bg-brand-bg"
            : "border-brand-coral text-brand-coral-dark hover:bg-brand-coral-tint"
        }`}
      >
        {busy ? "…" : verified ? dict.pharmacien.unmarkVerified : dict.pharmacien.markVerified}
      </button>
      {errorMsg && <span className="text-[11px] text-brand-coral-dark">{errorMsg}</span>}
    </div>
  );
}
