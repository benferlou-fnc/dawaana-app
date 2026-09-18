/**
 * Son de notification — fichier audio fourni (`public/sounds/notification-
 * success.wav`), joué via un simple élément `<audio>`. Les navigateurs
 * bloquent la lecture tant que la page n'a reçu aucune interaction : c'est
 * pour ça qu'on « débloque » l'élément dès le premier geste utilisateur
 * (voir `ensureAudioUnlocked`) — sans ça, le son déclenché plus tard par le
 * sondage automatique de la cloche serait ignoré silencieusement. Préférence
 * de coupure du son mémorisée par appareil (localStorage), pas synchronisée
 * entre appareils.
 */

const MUTE_KEY = "dawaana_notif_muted";
const SOUND_SRC = "/sounds/notification-success.wav";

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

let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(SOUND_SRC);
    sharedAudio.preload = "auto";
    sharedAudio.volume = 0.6;
  }
  return sharedAudio;
}

/**
 * À appeler depuis un vrai geste utilisateur (clic, touche) tôt dans la
 * session : joue puis coupe immédiatement l'élément audio, ce qui suffit à
 * satisfaire la politique d'autoplay du navigateur pour le reste de la
 * session — y compris pour un déclenchement automatique plus tard (le
 * sondage périodique de la cloche n'est pas un geste).
 */
export function ensureAudioUnlocked() {
  const audio = getAudio();
  if (!audio) return;
  const played = audio.play();
  if (played && typeof played.then === "function") {
    played
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        // Toujours bloqué à ce stade (pas encore de vrai geste) — pas grave,
        // on retentera à la prochaine interaction.
      });
  }
}

export function playNotificationSound() {
  if (isNotificationSoundMuted()) return;
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Lecture bloquée (autoplay, appareil en silencieux…) — silencieux.
    });
  } catch {
    // Idem.
  }
}
