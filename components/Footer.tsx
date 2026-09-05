import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.png"
                alt="Dawaana"
                width={28}
                height={28}
                className="w-7 h-7 rounded-lg object-cover flex-none"
              />
              <span className="font-display font-bold text-base">Dawaana</span>
            </div>
            <p className="text-xs text-brand-ink-faint leading-relaxed">
              Projet solidaire à but non lucratif. Dawaana ne vend ni
              n&apos;achète aucun médicament : la plateforme met en relation,
              gratuitement, ceux qui cherchent et ceux qui peuvent aider.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5 text-xs text-brand-ink-faint">
            <Link href="/annonces" className="hover:text-brand-coral-dark">
              Parcourir les annonces
            </Link>
            <Link href="/voyages" className="hover:text-brand-coral-dark">
              Carnet de voyages
            </Link>
            <Link href="/confidentialite" className="hover:text-brand-coral-dark">
              Vos données personnelles
            </Link>
          </nav>
        </div>
        <div className="pt-5 border-t border-brand-border text-xs text-brand-ink-faint">
          Association en cours de constitution — mentions légales à compléter ·
          Aucune transaction financière n&apos;est autorisée sur cette
          plateforme.
        </div>
      </div>
    </footer>
  );
}
