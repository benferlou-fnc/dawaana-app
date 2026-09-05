import Link from "next/link";
import { ShieldIcon } from "@/components/icons";

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
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-display font-extrabold text-[30px] leading-tight">
          Vos données sur Dawaana
        </h1>
        <p className="text-brand-ink-soft leading-relaxed">
          Dawaana traite un sujet sensible : la santé. Cette page explique
          exactement ce qui est collecté, ce qui ne l&apos;est pas, et ce que
          vous pouvez exiger. Elle s&apos;inscrit dans le cadre de la loi 25-11
          du 24 juillet 2025 relative à la protection des personnes physiques
          dans le traitement des données à caractère personnel.
        </p>
      </header>

      <div className="flex gap-3.5 p-5 bg-brand-green-tint rounded-2xl">
        <ShieldIcon size={20} className="text-brand-green-dark flex-none mt-0.5" />
        <p className="text-[14px] text-brand-green-dark leading-relaxed">
          <strong>Le principe de base : on demande le strict minimum.</strong>{" "}
          Une annonce de recherche révèle un besoin de santé. C&apos;est
          pourquoi on ne vous demande jamais votre nom de famille, et pourquoi
          seul votre prénom apparaît publiquement.
        </p>
      </div>

      <Section title="Ce qui est collecté">
        <p>Quand vous publiez une annonce :</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>votre prénom</li>
          <li>le nom du médicament, son dosage et la quantité</li>
          <li>la wilaya concernée et le niveau d&apos;urgence</li>
          <li>le texte libre que vous écrivez dans « contexte »</li>
          <li>
            pour un don venant de l&apos;étranger : le pays, éventuellement la
            ville, et la date de vol si vous la renseignez
          </li>
          <li>la date et l&apos;heure de votre consentement</li>
        </ul>
        <p>Quand vous annoncez un trajet :</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>votre prénom</li>
          <li>le pays et éventuellement la ville de départ</li>
          <li>la wilaya d&apos;arrivée et la date</li>
          <li>votre note de disponibilité, si vous en écrivez une</li>
        </ul>
      </Section>

      <Section title="Ce qui n'est jamais collecté">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>votre nom de famille</li>
          <li>votre pièce d&apos;identité, ni aucune photo de vous</li>
          <li>votre numéro de téléphone, votre adresse, votre e-mail</li>
          <li>votre ordonnance ou tout document médical</li>
          <li>votre diagnostic ou votre pathologie</li>
        </ul>
        <p>
          Le champ « contexte » est libre : n&apos;y écrivez pas d&apos;élément
          qui permettrait de vous identifier, ni de détail médical dont vous ne
          souhaitez pas qu&apos;il soit public.
        </p>
      </Section>

      <Section title="La vérification d'identité">
        <p>
          Pour limiter les faux comptes, Dawaana prévoit de faire vérifier
          l&apos;identité des membres par un prestataire spécialisé. Le principe
          retenu : le prestataire effectue le contrôle et ne renvoie à Dawaana
          qu&apos;une réponse « vérifié : oui / non ». <strong>Aucune pièce
          d&apos;identité, aucun selfie et aucun numéro de téléphone ne sont
          stockés dans notre base.</strong>
        </p>
        <p>
          Ce dispositif <ToComplete>n&apos;est pas encore actif</ToComplete> : le
          badge « identité vérifiée » n&apos;apparaît sur aucune annonce
          aujourd&apos;hui.
        </p>
      </Section>

      <Section title="À quoi servent ces données">
        <p>
          Uniquement à mettre en relation une personne qui cherche un médicament
          et une personne qui en a un à donner. Aucune donnée n&apos;est vendue,
          louée, ni utilisée à des fins publicitaires. Dawaana ne perçoit aucun
          argent et n&apos;en fait circuler aucun.
        </p>
        <p>
          La base légale du traitement est votre <strong>consentement
          explicite</strong>, donné en cochant la case avant publication.
        </p>
      </Section>

      <Section title="Où les données sont hébergées">
        <p>
          Les annonces sont stockées chez Supabase, sur des serveurs situés en
          Irlande (Union européenne). Les données sortent donc du territoire
          algérien.{" "}
          <ToComplete>
            Ce transfert doit faire l&apos;objet des formalités prévues par la
            loi 25-11 auprès de l&apos;ANPDP avant toute mise en ligne publique.
          </ToComplete>
        </p>
        <p>
          Techniquement, personne ne peut modifier ni supprimer une annonce
          depuis le site : ces opérations sont réservées à l&apos;administration
          de Dawaana.
        </p>
      </Section>

      <Section title="Combien de temps elles sont conservées">
        <p>
          Une annonce reste visible tant qu&apos;elle est active. Une fois
          résolue ou retirée, elle disparaît du site.{" "}
          <ToComplete>
            Durée de conservation en base après retrait : à fixer, puis à
            appliquer automatiquement.
          </ToComplete>
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous pouvez demander à accéder à vos données, à les corriger, à les
          faire supprimer, ou retirer votre consentement à tout moment — sans
          avoir à vous justifier. Une demande de suppression entraîne le retrait
          de l&apos;annonce concernée.
        </p>
        <p>
          Pour exercer ces droits, écrivez à{" "}
          <ToComplete>[adresse e-mail de contact à créer]</ToComplete>.
        </p>
      </Section>

      <Section title="Responsable du traitement">
        <p>
          <ToComplete>
            [Identité et adresse du responsable du traitement à compléter — une
            association déclarée, ou la personne physique qui porte le projet.]
          </ToComplete>
        </p>
        <p>
          La loi 25-11 impose également, pour un traitement de cette nature, la
          désignation d&apos;un délégué à la protection des données et la
          réalisation d&apos;une analyse d&apos;impact préalable.{" "}
          <ToComplete>Ces deux étapes restent à accomplir.</ToComplete>
        </p>
      </Section>

      <Section title="Ce que Dawaana n'organise pas">
        <p>
          Dawaana n&apos;est pas une pharmacie en ligne. Aucune vente n&apos;est
          autorisée, aucun envoi postal de médicament non plus, et la plateforme
          n&apos;organise pas le transport de médicaments pour le compte
          d&apos;autrui. La réglementation douanière algérienne exige qu&apos;un
          médicament transporté soit étiqueté au nom du voyageur et accompagné de
          son ordonnance ; le carnet de voyages sert à savoir qui sera sur place,
          pas à confier un colis à un inconnu.
        </p>
      </Section>

      <footer className="border-t border-brand-border pt-6 flex flex-wrap gap-4 justify-between text-sm">
        <Link href="/" className="text-brand-ink-soft hover:text-brand-coral-dark">
          ← Retour à l&apos;accueil
        </Link>
        <span className="text-brand-ink-faint">
          Les passages surlignés restent à compléter avant une mise en ligne
          publique.
        </span>
      </footer>
    </div>
  );
}
