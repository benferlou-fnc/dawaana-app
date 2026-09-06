"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function HelpButton({
  listingType,
  locale,
}: {
  listingType: "recherche" | "don";
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="w-full rounded-xl bg-brand-green-tint text-brand-green-dark text-sm px-4 py-4 text-center leading-relaxed">
        {dict.helpButton.thankYou}
        <div className="text-[11px] mt-2 opacity-80">{dict.helpButton.devNote}</div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="w-full h-[52px] rounded-xl bg-brand-coral text-white font-display font-semibold hover:brightness-95 transition"
    >
      {listingType === "don" ? dict.helpButton.interestedDon : dict.helpButton.canHelpRequest}
    </button>
  );
}
