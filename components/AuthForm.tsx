"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ArrowRightIcon, ShieldIcon } from "./icons";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.8 41 15.3 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.4-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.3 2 7.8 7 4.3 14.2l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
    </svg>
  );
}

export default function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const router = useRouter();
  const isSignup = mode === "inscription";

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const field =
    "w-full h-12 rounded-xl border-[1.5px] border-brand-border px-4 text-sm outline-none focus:border-brand-green";

  function friendlyError(message: string) {
    const m = message.toLowerCase();
    if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "Un compte existe déjà avec cet e-mail. Connectez-vous plutôt.";
    if (m.includes("password") && m.includes("6"))
      return "Le mot de passe doit contenir au moins 6 caractères.";
    if (m.includes("email not confirmed"))
      return "Votre e-mail n'est pas encore confirmé — vérifiez votre boîte de réception.";
    if (m.includes("provider is not enabled"))
      return "La connexion Google n'est pas encore activée sur ce site.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    return message;
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg("La base de données n'est pas connectée sur cet environnement.");
      return;
    }
    if (isSignup && !firstName.trim()) {
      setErrorMsg("Merci d'indiquer votre prénom.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg("Merci de renseigner votre e-mail et votre mot de passe.");
      return;
    }

    setBusy(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: firstName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setBusy(false);

      if (error) {
        setErrorMsg(friendlyError(error.message));
        return;
      }
      // Sans session renvoyée, Supabase attend une confirmation par e-mail.
      if (!data.session) {
        setInfoMsg(
          "Compte créé. Ouvrez l'e-mail de confirmation que nous venons de vous envoyer pour activer votre compte."
        );
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);

      if (error) {
        setErrorMsg(friendlyError(error.message));
        return;
      }
    }

    router.refresh();
    router.push("/mon-compte");
  }

  async function handleGoogle() {
    setErrorMsg(null);
    if (!isSupabaseConfigured) {
      setErrorMsg("La base de données n'est pas connectée sur cet environnement.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      setErrorMsg(friendlyError(error.message));
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-14">
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-[28px]">
          {isSignup ? "Créer un compte" : "Se connecter"}
        </h1>
        <p className="text-brand-ink-soft text-sm mt-1">
          {isSignup
            ? "Un compte permet de publier, puis de retirer vos annonces quand vous n'en avez plus besoin."
            : "Retrouvez vos annonces et vos trajets."}
        </p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-[20px] p-7 flex flex-col gap-5">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-12 rounded-xl border-[1.5px] border-brand-border flex items-center justify-center gap-3 font-display font-semibold text-sm hover:bg-brand-bg transition disabled:opacity-60"
        >
          <GoogleMark />
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 text-xs text-brand-ink-faint">
          <span className="h-px flex-1 bg-brand-border" />
          ou
          <span className="h-px flex-1 bg-brand-border" />
        </div>

        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          {isSignup && (
            <div>
              <label className="block text-[13.5px] font-semibold mb-2">Prénom</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex. Amine"
                autoComplete="given-name"
                className={field}
              />
              <p className="text-xs text-brand-ink-faint mt-2">
                C&apos;est le seul élément affiché publiquement à côté de vos annonces.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[13.5px] font-semibold mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
              className={field}
            />
          </div>

          <div>
            <label className="block text-[13.5px] font-semibold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "6 caractères minimum" : "Votre mot de passe"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={field}
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-brand-coral-dark bg-brand-coral-tint rounded-xl px-4 py-3">
              {errorMsg}
            </div>
          )}
          {infoMsg && (
            <div className="text-sm text-brand-green-dark bg-brand-green-tint rounded-xl px-4 py-3">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-[52px] rounded-xl bg-brand-coral text-white font-display font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? "Un instant…" : isSignup ? "Créer mon compte" : "Se connecter"}
            {!busy && <ArrowRightIcon />}
          </button>
        </form>

        <div className="flex gap-3 px-4 py-3.5 bg-brand-bg rounded-xl">
          <ShieldIcon size={17} className="text-brand-ink-faint flex-none mt-0.5" />
          <p className="text-xs text-brand-ink-faint leading-relaxed">
            Votre e-mail sert uniquement à vous connecter — il n&apos;est jamais
            affiché ni communiqué.{" "}
            <Link href="/confidentialite" className="underline underline-offset-2">
              Vos données
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-brand-ink-soft mt-6">
        {isSignup ? (
          <>
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-brand-coral-dark underline underline-offset-2">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-brand-coral-dark underline underline-offset-2">
              En créer un
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
