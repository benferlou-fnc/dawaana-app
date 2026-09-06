import PublierVoyageForm from "@/components/PublierVoyageForm";
import { getLocale } from "@/lib/i18n/locale";

export const metadata = { title: "J'annonce mon trajet — Dawaana" };

export default function PublierVoyagePage() {
  const locale = getLocale();
  return <PublierVoyageForm locale={locale} />;
}
