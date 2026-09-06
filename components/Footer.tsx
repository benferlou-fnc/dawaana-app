import Link from "next/link";
import LangSwitcher from "./LangSwitcher";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
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
            <p className="text-xs text-brand-ink-faint leading-relaxed">{dict.footer.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2.5 text-xs text-brand-ink-faint">
            <Link href="/annonces" className="hover:text-brand-coral-dark">
              {dict.footer.browseListings}
            </Link>
            <Link href="/voyages" className="hover:text-brand-coral-dark">
              {dict.footer.travelJournal}
            </Link>
            <Link href="/confidentialite" className="hover:text-brand-coral-dark">
              {dict.footer.privacyData}
            </Link>
            <LangSwitcher locale={locale} className="!h-auto !px-0 justify-start" />
          </nav>
        </div>
        <div className="pt-5 border-t border-brand-border text-xs text-brand-ink-faint">
          {dict.footer.legalNotice}
        </div>
      </div>
    </footer>
  );
}
