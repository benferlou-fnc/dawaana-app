import { PillIcon } from "./icons";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/**
 * Badge distinct du badge « identité vérifiée » : celui-ci porte sur le
 * médicament lui-même (bon produit, bon dosage, péremption valable), posé
 * uniquement par un compte pharmacien. N'affiche rien tant que ce n'est pas
 * le cas — contrairement au badge d'identité, il n'y a pas d'état « non
 * contrôlé » à afficher sur chaque annonce.
 */
export default function MedicationVerifiedBadge({
  verified,
  locale,
}: {
  verified: boolean;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  if (!verified) return null;

  return (
    <span
      title={dict.medicationBadge.verifiedTitle}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-coral-dark bg-brand-coral-tint rounded-full px-2 py-0.5"
    >
      <PillIcon size={12} />
      {dict.medicationBadge.verified}
    </span>
  );
}
