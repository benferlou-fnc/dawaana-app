/**
 * Petit son de notification, généré directement en JS (pas de fichier audio
 * à héberger) : deux notes courtes façon « ding ». Certains navigateurs
 * bloquent l'audio tant que la page n'a reçu aucune interaction — dans ce
 * cas le son ne joue simplement pas au tout premier chargement, sans erreur
 * visible. Préférence de coupure du son mémorisée par appareil
 * (localStorage), pas synchronisée entre appareils.
 */

const MUTE_KEY = "dawaana_notif_muted";

export function isNotificationSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotificationSoundMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Stockage indisponible (navigation privée…) — tant pis, pas bloquant.
  }
}

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

export function playNotificationSound() {
  if (isNotificationSoundMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const notes: Array<[number, number]> = [
      [880, now],
      [1318.5, now + 0.09],
    ];
    for (const [freq, start] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    }
  } catch {
    // Lecture impossible (politique d'autoplay, contexte fermé…) — silencieux.
  }
}
