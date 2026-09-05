/** « 12 octobre 2026 ». Rendu identique côté serveur et client (UTC). */
export function formatDateFr(dateIso: string): string {
  return new Date(`${dateIso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Nombre de jours entiers d'ici une date (négatif si elle est passée). */
export function daysUntil(dateIso: string): number {
  const target = new Date(`${dateIso.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - todayUtc) / 86400000);
}

export function relativeTimeFr(dateIso: string): string {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "il y a 1 jour";
  if (diffD < 30) return `il y a ${diffD} jours`;
  const diffMonth = Math.floor(diffD / 30);
  return `il y a ${diffMonth} mois`;
}
