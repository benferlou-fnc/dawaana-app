import AuthForm from "@/components/AuthForm";
import { getLocale } from "@/lib/i18n/locale";

export const metadata = { title: "Se connecter — Dawaana" };

export default function ConnexionPage() {
  const locale = getLocale();
  return <AuthForm mode="connexion" locale={locale} />;
}
