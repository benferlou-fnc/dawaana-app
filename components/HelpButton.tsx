"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function HelpButton({
  listingId,
  listingType,
  locale,
}: {
  listingId: string;
  listingType: "recherche" | "don";
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setLoggedIn(Boolean(user));
        setCheckingAuth(false);
      });
  }, []);

  async function handleClick() {
    setErrorMsg(null);
    setSending(true);
    const { error } = await createClient().rpc("express_interest", {
      target_listing_id: listingId,
    });
    setSending(false);
    if (error) {
      setErrorMsg(dict.helpButton.errorFailed);
      console.error(error);
      return;
    }
    setClicked(true);
  }

  if (clicked) {
    return (
      <div className="w-full rounded-xl bg-brand-green-tint text-brand-green-dark text-sm px-4 py-4 text-center leading-relaxed">
        {dict.helpButton.thankYou}
        <div className="text-[11px] mt-2 opacity-80">{dict.helpButton.devNote}</div>
      </div>
    );
  }

  if (!checkingAuth && !loggedIn) {
    return (
      <Link
        href="/connexion"
        className="w-full h-[52px] rounded-xl border border-brand-border flex items-center justify-center font-display font-semibold text-sm text-brand-ink-soft hover:bg-brand-bg transition"
      >
        {dict.helpButton.needAccount}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={checkingAuth || sending}
        className="w-full h-[52px] rounded-xl bg-brand-coral text-white font-display font-semibold hover:brightness-95 transition disabled:opacity-60"
      >
        {sending
          ? dict.helpButton.sending
          : listingType === "don"
          ? dict.helpButton.interestedDon
          : dict.helpButton.canHelpRequest}
      </button>
      {errorMsg && <p className="text-xs text-brand-coral-dark text-center">{errorMsg}</p>}
    </div>
  );
}
