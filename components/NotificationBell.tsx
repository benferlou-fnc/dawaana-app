"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";
import { relativeTime } from "@/lib/relativeTime";
import { BellIcon, VolumeIcon, VolumeOffIcon } from "./icons";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";
import {
  ensureAudioUnlocked,
  isNotificationSoundMuted,
  playNotificationSound,
  setNotificationSoundMuted,
} from "@/lib/notificationSound";

const POLL_MS = 45_000;

function notificationText(n: AppNotification, dict: ReturnType<typeof getDictionary>) {
  switch (n.type) {
    case "interest":
      return t(dict.notifications.interest, {
        name: n.data.helper_first_name || dict.notifications.someone,
        medication: n.data.medication_name || "",
      });
    case "identity_verified":
      return dict.notifications.identityVerified;
    case "medication_verified":
      return t(dict.notifications.medicationVerified, { medication: n.data.medication_name || "" });
    case "listing_moderated":
      return n.data.new_status === "active"
        ? t(dict.notifications.listingRestored, { medication: n.data.medication_name || "" })
        : t(dict.notifications.listingRemoved, { medication: n.data.medication_name || "" });
    default:
      return "";
  }
}

export default function NotificationBell({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    setMuted(isNotificationSoundMuted());
  }, []);

  // Débloque l'audio dès la première interaction avec la page (clic, touche,
  // tap) — sans ça, le navigateur ignore silencieusement le son déclenché
  // plus tard par le sondage automatique de la cloche.
  useEffect(() => {
    function unlock() {
      ensureAudioUnlocked();
    }
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setNotificationSoundMuted(next);
  }

  async function refreshCount() {
    const { count } = await createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    const next = count ?? 0;
    // Un son seulement quand le compte augmente par rapport au dernier relevé
    // (jamais au tout premier chargement, pour ne pas sonner sur des
    // notifications déjà en attente avant l'ouverture de la page).
    if (prevUnreadRef.current !== null && next > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = next;
    setUnreadCount(next);
  }

  async function loadList() {
    setLoading(true);
    const { data } = await createClient()
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as AppNotification[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  function toggle() {
    ensureAudioUnlocked();
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function markRead(n: AppNotification) {
    if (!n.read_at) {
      await createClient()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.listing_id) router.push(`/annonces/${n.listing_id}`);
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;
    await createClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={dict.notifications.title}
        className="relative w-11 h-11 rounded-xl border border-brand-border flex items-center justify-center hover:bg-brand-bg transition flex-none"
      >
        <BellIcon size={18} className="text-brand-ink-soft" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-coral text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-[320px] max-h-[420px] overflow-y-auto bg-brand-surface border border-brand-border rounded-2xl shadow-lg z-30 flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-brand-border sticky top-0 bg-brand-surface">
              <span className="font-display font-bold text-sm">{dict.notifications.title}</span>
              <div className="flex items-center gap-3 flex-none">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-brand-coral-dark underline underline-offset-2"
                  >
                    {dict.notifications.markAllRead}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? dict.notifications.unmute : dict.notifications.mute}
                  title={muted ? dict.notifications.unmute : dict.notifications.mute}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-brand-ink-faint hover:text-brand-ink-soft hover:bg-brand-bg transition flex-none"
                >
                  {muted ? <VolumeOffIcon size={14} /> : <VolumeIcon size={14} />}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-brand-ink-faint">{dict.publier.loading}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-brand-ink-faint">{dict.notifications.empty}</div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n)}
                      className={`w-full text-left rtl:text-right px-4 py-3 border-b border-brand-border last:border-0 flex gap-2.5 hover:bg-brand-bg transition ${
                        !n.read_at ? "bg-brand-coral-tint/40" : ""
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${
                          !n.read_at ? "bg-brand-coral" : "bg-transparent"
                        }`}
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-brand-ink leading-snug">{notificationText(n, dict)}</span>
                        <span className="text-[11px] text-brand-ink-faint">{relativeTime(n.created_at, locale)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
