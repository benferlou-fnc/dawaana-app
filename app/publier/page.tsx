import PublierForm from "@/components/PublierForm";
import { getLocale } from "@/lib/i18n/locale";

export const metadata = { title: "Publier une annonce — Dawaana" };

export default function PublierPage() {
  const locale = getLocale();
  return <PublierForm locale={locale} />;
}
