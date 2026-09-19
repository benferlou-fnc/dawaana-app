"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function SignOutButton({
  className,
  locale,
}: {
  className?: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } catch {
      // Jeton déjà expiré côté serveur : la session locale est effacée
      // quand même, on peut sortir sans rien dire.
    }
    // router.refresh() ne suffisait pas. Next garde la mise en page en
    // cache dans le navigateur, et l'en-tête en fait partie : le prénom y
    // restait affiché alors que la session n'existait plus. Un vrai
    // chargement de page la redemande au serveur, qui la reconstruit sans
    // session — en-tête, cloche et barre d'onglets compris.
    window.location.assign("/");
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {busy ? dict.account.signingOut : dict.account.signOut}
    </button>
  );
}
