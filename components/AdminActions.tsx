"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Table = "listings" | "trips";

/** Retirer / remettre en ligne / supprimer une publication, en tant que modérateur. */
export function ModerateActions({
  table,
  id,
  status,
}: {
  table: Table;
  id: string;
  status: string;
}) {
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
      setErrorMsg("Action refusée.");
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
      setErrorMsg("Suppression refusée.");
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
          Retirer
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => setStatus("active")} className={btn}>
          Remettre
        </button>
      )}

      {!confirming ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(true)}
          className={`${btn} text-brand-coral-dark border-brand-coral`}
        >
          Supprimer
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-brand-coral text-white disabled:opacity-50"
          >
            {busy ? "…" : "Confirmer"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={btn}>
            Annuler
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
}: {
  profileId: string;
  verified: boolean;
}) {
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
      setErrorMsg("Action refusée.");
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
        {busy ? "…" : verified ? "Retirer le badge" : "Marquer vérifié"}
      </button>
      {errorMsg && <span className="text-[11px] text-brand-coral-dark">{errorMsg}</span>}
    </div>
  );
}
