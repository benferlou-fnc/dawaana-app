"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon, PlaneIcon, PlusIcon, ShieldIcon, UserIcon } from "./icons";

const TABS = [
  { href: "/", label: "Accueil", Icon: ShieldIcon },
  { href: "/annonces", label: "Annonces", Icon: SearchIcon },
  { href: "/voyages", label: "Voyages", Icon: PlaneIcon },
  { href: "/publier", label: "Publier", Icon: PlusIcon },
  { href: "/mon-compte", label: "Compte", Icon: UserIcon },
];

/**
 * Barre d'onglets affichée uniquement sur mobile : le menu de l'en-tête est
 * masqué sous md, et sans elle on ne peut atteindre ni les annonces ni les
 * trajets depuis un téléphone.
 */
export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-brand-surface border-t border-brand-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-brand-coral-dark" : "text-brand-ink-faint"
                }`}
              >
                <Icon size={19} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
