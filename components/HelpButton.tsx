"use client";

import { useState } from "react";

export default function HelpButton({ listingType }: { listingType: "recherche" | "don" }) {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="w-full rounded-xl bg-brand-green-tint text-brand-green-dark text-sm px-4 py-4 text-center leading-relaxed">
        Merci ! Un bénévole du réseau Dawaana va examiner votre proposition et
        vous recontacter via une messagerie sécurisée.
        <div className="text-[11px] mt-2 opacity-80">
          (La messagerie intégrée est encore en développement pour cette
          version de démonstration.)
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="w-full h-[52px] rounded-xl bg-brand-coral text-white font-display font-semibold hover:brightness-95 transition"
    >
      {listingType === "don" ? "Je suis intéressé(e) par ce don" : "Je peux aider ce cas"}
    </button>
  );
}
