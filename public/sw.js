/**
 * Service worker minimal.
 *
 * Rôle : rendre l'application installable sur Android (Chrome exige un service
 * worker avec un gestionnaire « fetch ») et afficher une page lisible quand le
 * téléphone n'a pas de réseau.
 *
 * Ce qu'il ne fait PAS, volontairement : mettre en cache les pages et les
 * fichiers de build. Les annonces changent en permanence — servir une version
 * périmée d'une demande de médicament serait pire que d'afficher une erreur.
 */

const OFFLINE_URL = "/hors-ligne.html";
const CACHE = "dawaana-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Seule la navigation est interceptée : tout le reste passe au réseau tel quel.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      const fallback = await cache.match(OFFLINE_URL);
      return (
        fallback ||
        new Response("Hors ligne", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    })
  );
});
