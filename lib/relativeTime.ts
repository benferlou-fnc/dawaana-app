import type { Locale } from "./i18n/locale";

function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-DZ" : "fr-FR";
}

/** « 12 octobre 2026 » / « 12 أكتوبر 2026 ». Rendu identique côté serveur et client (UTC). */
export function formatDate(dateIso: string, locale: Locale = "fr"): string {
  return new Date(`${dateIso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** @deprecated utiliser formatDate(dateIso, locale) */
export function formatDateFr(dateIso: string): string {
  return formatDate(dateIso, "fr");
}

/** Nombre de jours entiers d'ici une date (négatif si elle est passée). */
export function daysUntil(dateIso: string): number {
  const target = new Date(`${dateIso.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - todayUtc) / 86400000);
}

/** « il y a 3 jours » / « قبل 3 أيام », via Intl.RelativeTimeFormat. */
export function relativeTime(dateIso: string, locale: Locale = "fr"): string {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });

  if (diffMin < 1) return locale === "ar" ? "الآن" : "à l'instant";
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return rtf.format(-diffH, "hour");
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return rtf.format(-diffD, "day");
  const diffMonth = Math.floor(diffD / 30);
  return rtf.format(-diffMonth, "month");
}

/** @deprecated utiliser relativeTime(dateIso, locale) */
export function relativeTimeFr(dateIso: string): string {
  return relativeTime(dateIso, "fr");
}
