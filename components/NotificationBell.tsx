"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";
import { relativeTime } from "@/lib/relativeTime";
import { BellIcon } from "./icons";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary, t } from "@/lib/i18n/dictionary";

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

  async function refreshCount() {
    const { count } = await createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setUnreadCount(count ?? 0);
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
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-brand-coral-dark underline underline-offset-2"
                >
                  {dict.notifications.markAllRead}
                </button>
              )}
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
