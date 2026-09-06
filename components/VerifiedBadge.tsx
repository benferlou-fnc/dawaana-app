import { BadgeCheckIcon } from "./icons";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Badge affiché à côté d'un prénom. « Vérifié » signifie qu'un prestataire
 * externe a confirmé l'identité de la personne et nous a renvoyé un simple
 * oui/non — aucune pièce d'identité ni selfie n'est conservé par Dawaana.
 */
export default function VerifiedBadge({
  verified,
  locale,
}: {
  verified: boolean;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  if (verified) {
    return (
      <span
        title={dict.verifiedBadge.verifiedTitle}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green-dark bg-brand-green-tint rounded-full px-2 py-0.5"
      >
        <BadgeCheckIcon size={12} />
        {dict.verifiedBadge.verified}
      </span>
    );
  }

  return (
    <span
      title={dict.verifiedBadge.notVerifiedTitle}
      className="inline-flex items-center text-[11px] font-medium text-brand-ink-faint border border-brand-border rounded-full px-2 py-0.5"
    >
      {dict.verifiedBadge.notVerified}
    </span>
  );
}
