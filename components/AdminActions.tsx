"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

type Table = "listings" | "trips";

/** Retirer / remettre en ligne / supprimer une publication, en tant que modérateur. */
export function ModerateActions({
  table,
  id,
  status,
  locale,
}: {
  table: Table;
  id: string;
  status: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function setStatus(next: string) {
    setBusy(true);
    setErrorMsg(null);
    const { error } = await createClient().from(table).update({ status: next }).eq("id", id);
    setBusy(false);
    if (error) {
      setErrorMsg(dict.admin.actionRefused);
      console.error(error);
      return;
    }
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setErrorMsg(null);
    const { error } = await createClient().from(table).delete().eq("id", id);
    setBusy(false);
    if (error) {
      setErrorMsg(dict.admin.deleteRefused);
      console.error(error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  const btn =
    "h-8 px-3 rounded-lg text-[11px] font-semibold border border-brand-border hover:bg-brand-bg transition disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "active" ? (
        <button type="button" disabled={busy} onClick={() => setStatus(table === "listings" ? "retiree" : "retire")} className={btn}>
          {dict.admin.remove}
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => setStatus("active")} className={btn}>
          {dict.admin.restore}
        </button>
      )}

      {!confirming ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(true)}
          className={`${btn} text-brand-coral-dark border-brand-coral`}
        >
          {dict.admin.delete}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-brand-coral text-white disabled:opacity-50"
          >
            {busy ? "…" : dict.admin.confirm}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={btn}>
            {dict.admin.cancel}
          </button>
        </span>
      )}

      {errorMsg && <span className="text-[11px] text-brand-coral-dark">{errorMsg}</span>}
    </div>
  );
}

/**
 * Pose ou retire le badge « identité vérifiée ».
 * Passe par une fonction en base : la colonne elle-même est interdite en
 * écriture, y compris aux administrateurs.
 */
export function VerifyToggle({
  profileId,
  verified,
  locale,
}: {
  profileId: string;
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
    const { error } = await createClient().rpc("admin_set_verified", {
      target_id: profileId,
      verified: !verified,
    });
    setBusy(false);
    if (error) {
      setErrorMsg(dict.admin.actionRefused);
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
            : "border-brand-green text-brand-green-dark hover:bg-brand-green-tint"
        }`}
      >
        {busy ? "…" : verified ? dict.admin.unmarkVerified : dict.admin.markVerified}
      </button>
      {errorMsg && <span className="text-[11px] text-brand-coral-dark">{errorMsg}</span>}
    </div>
  );
}
