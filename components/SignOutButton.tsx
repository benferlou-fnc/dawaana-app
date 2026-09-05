"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ className }: { className?: string }) {
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
      {busy ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
