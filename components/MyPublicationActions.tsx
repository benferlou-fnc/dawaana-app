"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

type Table = "listings" | "trips";

export function StatusActions({
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function setStatus(next: string) {
    setBusy(true);
    setErrorMsg(null);
    const { error } = await createClient().from(table).update({ status: next }).eq("id", id);
    setBusy(false);

    if (error) {
      setErrorMsg(dict.account.modifyError);
      console.error(error);
      return;
    }
    router.refresh();
  }

  const btn =
    "h-9 px-3.5 rounded-lg text-xs font-semibold border border-brand-border hover:bg-brand-bg transition disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "active" ? (
        <>
          {table === "listings" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus("resolue")}
              className={`${btn} text-brand-green-dark border-brand-green`}
            >
              {dict.account.resolved}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus(table === "listings" ? "retiree" : "retire")}
            className={btn}
          >
            {dict.account.removeFromSite}
          </button>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => setStatus("active")} className={btn}>
          {dict.account.putBackOnline}
        </button>
      )}
      {errorMsg && <span className="text-xs text-brand-coral-dark">{errorMsg}</span>}
    </div>
  );
}

export function DeleteEverything({ count, locale }: { count: number; locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function deleteAll() {
    setBusy(true);
    setErrorMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBusy(false);
      setErrorMsg(dict.account.sessionExpired);
      return;
    }

    const [a, b] = await Promise.all([
      supabase.from("listings").delete().eq("user_id", user.id),
      supabase.from("trips").delete().eq("user_id", user.id),
    ]);
    setBusy(false);

    if (a.error || b.error) {
      setErrorMsg(dict.account.deleteFailed);
      console.error(a.error || b.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start text-xs font-semibold text-brand-coral-dark underline underline-offset-2"
        >
          {dict.account.deleteEverythingButton}
        </button>
      ) : (
        <div className="flex flex-col gap-3 p-4 bg-brand-coral-tint rounded-xl">
          <p className="text-sm text-brand-ink leading-relaxed">
            {count === 1
              ? dict.account.deleteConfirmSingle
              : t(dict.account.deleteConfirmMultiple, { count })}{" "}
            {dict.account.deleteConfirmIrreversible}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteAll}
              disabled={busy}
              className="h-10 px-4 rounded-lg bg-brand-coral text-white text-xs font-semibold disabled:opacity-60"
            >
              {busy ? dict.account.deleting : dict.account.deleteConfirmYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="h-10 px-4 rounded-lg border border-brand-border text-xs font-semibold"
            >
              {dict.account.cancel}
            </button>
          </div>
          {errorMsg && <span className="text-xs text-brand-coral-dark">{errorMsg}</span>}
        </div>
      )}
    </div>
  );
}
