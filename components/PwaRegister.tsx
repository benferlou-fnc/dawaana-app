"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker, ce qui rend l'application installable sur
 * l'écran d'accueil d'un téléphone Android. Sans effet en développement local
 * (le service worker n'y apporte rien et complique le rechargement à chaud).
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker non enregistré", err);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
