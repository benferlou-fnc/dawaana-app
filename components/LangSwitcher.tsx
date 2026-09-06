"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/** Petit bouton qui bascule le cookie de langue puis rafraîchit la page courante. */
export default function LangSwitcher({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const target: Locale = locale === "ar" ? "fr" : "ar";
  const label = target === "ar" ? dict.langSwitcher.arabic : dict.langSwitcher.french;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setLocaleAction(target, pathname || "/");
          router.refresh();
        })
      }
      className={
        "inline-flex items-center h-11 px-3 rounded-xl text-sm font-semibold text-brand-ink-soft hover:text-brand-coral-dark hover:bg-brand-bg transition disabled:opacity-60 " +
        className
      }
    >
      {label}
    </button>
  );
}
