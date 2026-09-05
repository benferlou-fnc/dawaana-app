import { BadgeCheckIcon } from "./icons";

/**
 * Badge affiché à côté d'un prénom. « Vérifié » signifie qu'un prestataire
 * externe a confirmé l'identité de la personne et nous a renvoyé un simple
 * oui/non — aucune pièce d'identité ni selfie n'est conservé par Dawaana.
 */
export default function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span
        title="Identité confirmée par notre prestataire de vérification"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green-dark bg-brand-green-tint rounded-full px-2 py-0.5"
      >
        <BadgeCheckIcon size={12} />
        Identité vérifiée
      </span>
    );
  }

  return (
    <span
      title="Cette personne n'a pas encore fait vérifier son identité"
      className="inline-flex items-center text-[11px] font-medium text-brand-ink-faint border border-brand-border rounded-full px-2 py-0.5"
    >
      Non vérifié
    </span>
  );
}
