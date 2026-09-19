"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { BellIcon } from "./icons";

/** Convertit la clé publique VAPID (base64url) au format Uint8Array attendu
 * par `PushManager.subscribe`. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "off" | "on" | "denied";

/**
 * Active/désactive les notifications push du navigateur (dons à contrôler)
 * pour un pharmacien bénévole. Utilise le service worker déjà enregistré par
 * PwaRegister — pas de logique d'installation ici, seulement l'abonnement.
 */
export default function PushNotificationToggle({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // « Réessayez depuis les réglages du navigateur » n'aide personne quand la
  // vraie cause est une clé absente ou un abonnement refusé : on affiche le
  // motif réel sous le message, au lieu de le laisser dans la console.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setStatus(sub ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(false);
    setErrorDetail(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        setBusy(false);
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error(
          "NEXT_PUBLIC_VAPID_PUBLIC_KEY absente de la configuration du site. " +
            "Cette variable est figée au moment de la construction : après l'avoir " +
            "ajoutée, il faut relancer un déploiement."
        );
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = sub.toJSON();
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { error: upsertError } = await createClient()
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint!,
            p256dh: json.keys!.p256dh,
            auth_key: json.keys!.auth,
          },
          { onConflict: "endpoint" }
        );
      if (upsertError) throw upsertError;

      setStatus("on");
    } catch (err) {
      console.error(err);
      setError(true);
      setErrorDetail(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(false);
    setErrorDetail(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error(err);
      setError(true);
      setErrorDetail(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking" || status === "unsupported") return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy || status === "denied"}
        onClick={status === "on" ? disable : enable}
        className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60 ${
          status === "on"
            ? "bg-brand-green-tint text-brand-green-dark"
            : "border border-brand-border hover:bg-brand-bg"
        }`}
      >
        <BellIcon size={15} />
        {status === "denied"
          ? dict.pharmacien.pushDenied
          : status === "on"
          ? dict.pharmacien.pushOn
          : busy
          ? dict.pharmacien.pushWorking
          : dict.pharmacien.pushOff}
      </button>
      {error && (
        <div className="flex flex-col items-end gap-0.5 max-w-xs text-right rtl:text-left">
          <span className="text-[11px] text-brand-coral-dark">{dict.pharmacien.pushError}</span>
          {errorDetail && (
            <span className="text-[10.5px] text-brand-ink-faint leading-snug">{errorDetail}</span>
          )}
        </div>
      )}
    </div>
  );
}
