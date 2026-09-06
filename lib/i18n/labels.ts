import type { Locale } from "./locale";
import { WILAYAS } from "@/lib/wilayas";
import { DIASPORA_COUNTRIES } from "@/lib/countries";

/**
 * Ces maps ne servent qu'à l'AFFICHAGE. La valeur stockée en base et utilisée
 * pour les filtres reste toujours la chaîne française canonique (WILAYAS /
 * DIASPORA_COUNTRIES) — seul le libellé montré à l'écran change avec la langue.
 */
const WILAYA_AR: Record<(typeof WILAYAS)[number], string> = {
  Adrar: "أدرار",
  Chlef: "الشلف",
  Laghouat: "الأغواط",
  "Oum El Bouaghi": "أم البواقي",
  Batna: "باتنة",
  Béjaïa: "بجاية",
  Biskra: "بسكرة",
  Béchar: "بشار",
  Blida: "البليدة",
  Bouira: "البويرة",
  Tamanrasset: "تمنراست",
  Tébessa: "تبسة",
  Tlemcen: "تلمسان",
  Tiaret: "تيارت",
  "Tizi Ouzou": "تيزي وزو",
  Alger: "الجزائر",
  Djelfa: "الجلفة",
  Jijel: "جيجل",
  Sétif: "سطيف",
  Saïda: "سعيدة",
  Skikda: "سكيكدة",
  "Sidi Bel Abbès": "سيدي بلعباس",
  Annaba: "عنابة",
  Guelma: "قالمة",
  Constantine: "قسنطينة",
  Médéa: "المدية",
  Mostaganem: "مستغانم",
  "M'Sila": "المسيلة",
  Mascara: "معسكر",
  Ouargla: "ورقلة",
  Oran: "وهران",
  "El Bayadh": "البيض",
  Illizi: "إليزي",
  "Bordj Bou Arréridj": "برج بوعريريج",
  Boumerdès: "بومرداس",
  "El Tarf": "الطارف",
  Tindouf: "تندوف",
  Tissemsilt: "تيسمسيلت",
  "El Oued": "الوادي",
  Khenchela: "خنشلة",
  "Souk Ahras": "سوق أهراس",
  Tipaza: "تيبازة",
  Mila: "ميلة",
  "Aïn Defla": "عين الدفلى",
  Naâma: "النعامة",
  "Aïn Témouchent": "عين تموشنت",
  Ghardaïa: "غرداية",
  Relizane: "غليزان",
  Timimoun: "تيميمون",
  "Bordj Badji Mokhtar": "برج باجي مختار",
  "Ouled Djellal": "أولاد جلال",
  "Béni Abbès": "بني عباس",
  "In Salah": "عين صالح",
  "In Guezzam": "عين قزام",
  Touggourt: "تقرت",
  Djanet: "جانت",
  "El M'Ghair": "المغير",
  "El Meniaa": "المنيعة",
};

const COUNTRY_AR: Record<(typeof DIASPORA_COUNTRIES)[number], string> = {
  France: "فرنسا",
  Espagne: "إسبانيا",
  Canada: "كندا",
  Belgique: "بلجيكا",
  "Royaume-Uni": "المملكة المتحدة",
  Allemagne: "ألمانيا",
  Italie: "إيطاليا",
  Suisse: "سويسرا",
  Turquie: "تركيا",
  Tunisie: "تونس",
  Maroc: "المغرب",
  "Émirats arabes unis": "الإمارات العربية المتحدة",
  "Arabie saoudite": "المملكة العربية السعودية",
  Qatar: "قطر",
  "États-Unis": "الولايات المتحدة",
  "Pays-Bas": "هولندا",
  Suède: "السويد",
  Norvège: "النرويج",
  Autriche: "النمسا",
  Australie: "أستراليا",
  "Autre pays": "بلد آخر",
};

/** Libellé affiché pour une wilaya (valeur stockée toujours en français). */
export function wilayaLabel(wilaya: string, locale: Locale): string {
  if (locale === "ar" && wilaya in WILAYA_AR) {
    return WILAYA_AR[wilaya as (typeof WILAYAS)[number]];
  }
  return wilaya;
}

/** Libellé affiché pour un pays (valeur stockée toujours en français). */
export function countryLabel(country: string, locale: Locale): string {
  if (locale === "ar" && country in COUNTRY_AR) {
    return COUNTRY_AR[country as (typeof DIASPORA_COUNTRIES)[number]];
  }
  return country;
}
