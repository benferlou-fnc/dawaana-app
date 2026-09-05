import Link from "next/link";
import Logo from "./Logo";
import { PlusIcon } from "./icons";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function Nav() {
  const profile = isSupabaseConfigured ? await getCurrentProfile() : null;

  return (
    <header className="border-b border-brand-border bg-brand-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-brand-ink-soft">
          <Link href="/#comment-ca-marche" className="hover:text-brand-coral-dark">
            Comment ça marche
          </Link>
          <Link href="/annonces" className="hover:text-brand-coral-dark">
            Parcourir les annonces
          </Link>
          <Link href="/voyages" className="hover:text-brand-coral-dark">
            Carnet de voyages
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <Link
              href="/mon-compte"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-brand-border text-sm font-semibold hover:bg-brand-bg transition"
            >
              <span className="w-6 h-6 rounded-full bg-brand-green-tint text-brand-green-dark font-display font-bold text-xs flex items-center justify-center">
                {profile.first_name.slice(0, 1).toUpperCase()}
              </span>
              {profile.first_name}
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="hidden sm:inline-flex items-center h-11 px-4 rounded-xl text-sm font-semibold text-brand-ink-soft hover:text-brand-coral-dark transition"
            >
              Se connecter
            </Link>
          )}

          <Link
            href="/publier"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-coral text-white font-display font-semibold text-sm hover:brightness-95 transition"
          >
            <PlusIcon />
            Publier
            <span className="hidden md:inline">une annonce</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
