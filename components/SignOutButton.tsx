"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {busy ? dict.account.signingOut : dict.account.signOut}
    </button>
  );
}
