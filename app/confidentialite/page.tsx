import Link from "next/link";
import { ShieldIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const metadata = {
  title: "Données personnelles — Dawaana",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display font-bold text-lg">{title}</h2>
      <div className="flex flex-col gap-3 text-[14.5px] text-brand-ink-soft leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/** Ce qu'il reste à renseigner avant une mise en ligne publique. */
function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <mark className="bg-brand-coral-tint text-brand-coral-dark px-1.5 py-0.5 rounded font-medium">
      {children}
    </mark>
  );
}

export default function ConfidentialitePage() {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const c = dict.confidentialite;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-display font-extrabold text-[30px] leading-tight">{c.title}</h1>
        <p className="text-brand-ink-soft leading-relaxed">{c.intro}</p>
      </header>

      <div className="flex gap-3.5 p-5 bg-brand-green-tint rounded-2xl">
        <ShieldIcon size={20} className="text-brand-green-dark flex-none mt-0.5" />
        <p className="text-[14px] text-brand-green-dark leading-relaxed">
          <strong>{c.principleStrong}</strong> {c.principleBody}
        </p>
      </div>

      <Section title={c.collectedTitle}>
        <p>{c.collectedListingIntro}</p>
        <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 flex flex-col gap-1.5">
          <li>{c.collectedListing1}</li>
          <li>{c.collectedListing2}</li>
          <li>{c.collectedListing3}</li>
          <li>{c.collectedListing4}</li>
          <li>{c.collectedListing5}</li>
          <li>{c.collectedListing6}</li>
        </ul>
        <p>{c.collectedTripIntro}</p>
        <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 flex flex-col gap-1.5">
          <li>{c.collectedTrip1}</li>
          <li>{c.collectedTrip2}</li>
          <li>{c.collectedTrip3}</li>
          <li>{c.collectedTrip4}</li>
        </ul>
      </Section>

      <Section title={c.neverCollectedTitle}>
        <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 flex flex-col gap-1.5">
          <li>{c.neverCollected1}</li>
          <li>{c.neverCollected2}</li>
          <li>{c.neverCollected3}</li>
          <li>{c.neverCollected4}</li>
          <li>{c.neverCollected5}</li>
        </ul>
        <p>{c.neverCollectedNote}</p>
      </Section>

      <Section title={c.verificationTitle}>
        <p>
          {c.verificationBody} <strong>{c.verificationBodyStrong}</strong>
        </p>
        <p>
          {c.verificationNotActiveIntro}{" "}
          <ToComplete>{c.verificationNotActive}</ToComplete>
          {c.verificationNotActiveBody}
        </p>
      </Section>

      <Section title={c.purposeTitle}>
        <p>{c.purposeBody}</p>
        <p>
          {c.purposeLegalBase} <strong>{c.purposeLegalBaseStrong}</strong>
          {c.purposeLegalBaseEnd}
        </p>
      </Section>

      <Section title={c.hostingTitle}>
        <p>
          {c.hostingBody} <ToComplete>{c.hostingToComplete}</ToComplete>
        </p>
        <p>{c.hostingBody2}</p>
      </Section>

      <Section title={c.retentionTitle}>
        <p>
          {c.retentionBody} <ToComplete>{c.retentionToComplete}</ToComplete>
        </p>
      </Section>

      <Section title={c.rightsTitle}>
        <p>{c.rightsBody}</p>
        <p>
          {c.rightsContact} <ToComplete>{c.rightsContactToComplete}</ToComplete>.
        </p>
      </Section>

      <Section title={c.controllerTitle}>
        <p>
          <ToComplete>{c.controllerToComplete}</ToComplete>
        </p>
        <p>
          {c.controllerBody} <ToComplete>{c.controllerToComplete2}</ToComplete>
        </p>
      </Section>

      <Section title={c.notOrganizedTitle}>
        <p>{c.notOrganizedBody}</p>
      </Section>

      <footer className="border-t border-brand-border pt-6 flex flex-wrap gap-4 justify-between text-sm">
        <Link href="/" className="text-brand-ink-soft hover:text-brand-coral-dark">
          {c.backHome}
        </Link>
        <span className="text-brand-ink-faint">{c.footerNote}</span>
      </footer>
    </div>
  );
}
