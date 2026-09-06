import AuthForm from "@/components/AuthForm";
import { getLocale } from "@/lib/i18n/locale";

export const metadata = { title: "Créer un compte — Dawaana" };

export default function InscriptionPage() {
  const locale = getLocale();
  return <AuthForm mode="inscription" locale={locale} />;
}
