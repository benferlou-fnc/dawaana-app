# Dawaana — site fonctionnel (MVP)

Application Next.js 14 (App Router, TypeScript, Tailwind) connectée à
Supabase. C'est la première version codée du projet, au-delà de la
maquette visuelle : les formulaires écrivent vraiment en base, la liste
d'annonces est vraiment lue depuis la base.

## Ce qui est fait dans ce MVP

- Page d'accueil avec les 3 dernières annonces en direct
- Page "Parcourir les annonces" avec filtres (wilaya, type, urgence, recherche par nom)
- Formulaire de publication (demande ou don) qui écrit dans Supabase, sous
  **prénom seul**
- Emplacement du donateur quand il est à l'étranger (pays, ville) et date
  de vol / arrivée
- **Carnet de voyages** (`/voyages`) : un voyageur annonce son trajet
  (départ, arrivée, date), et la page de détail croise automatiquement ce
  trajet avec les demandes en attente dans la wilaya d'arrivée
- Badge "identité vérifiée" et colonne `identity_verified` — la structure
  est prête, la vérification elle-même n'est pas branchée
- Page `/confidentialite` : information sur les données, consentement
  explicite exigé avant chaque publication
- Sécurité de base : RLS Supabase (lecture publique des annonces et trajets
  actifs, publication ouverte, **aucune modification/suppression possible
  depuis le client**)

## Comptes utilisateurs

Inscription et connexion par **e-mail + mot de passe** ou **Google**, via
Supabase Auth. Publier exige désormais un compte — sinon l'auteur d'une
annonce ne pourrait jamais la retirer, et son besoin de santé resterait
public indéfiniment.

`/mon-compte` permet à chacun de marquer une annonce résolue, de la retirer,
de la remettre en ligne, ou de tout supprimer définitivement.

### Activer la connexion Google

L'e-mail + mot de passe fonctionne sans rien configurer. Pour Google :

1. Sur [console.cloud.google.com](https://console.cloud.google.com), créez un
   projet, puis **APIs & Services → Credentials → Create credentials →
   OAuth client ID**, type **Web application**.
2. Dans **Authorized redirect URIs**, collez l'URL indiquée par Supabase
   (Authentication → Providers → Google) — de la forme
   `https://<projet>.supabase.co/auth/v1/callback`.
3. Copiez le *client ID* et le *client secret* dans Supabase
   (Authentication → Providers → Google), puis activez le fournisseur.

Tant que ce n'est pas fait, le bouton Google affiche un message clair au lieu
de planter.

## Console d'administration (`/admin`)

Réservée aux comptes marqués administrateurs. Pour qui ne l'est pas, la page
répond « introuvable » plutôt qu'« accès refusé » : inutile de signaler son
existence.

Elle permet de voir toutes les annonces et tous les trajets quel que soit leur
statut, de les retirer, remettre en ligne ou supprimer, et de poser ou retirer
le badge « identité vérifiée » d'un membre.

### Désigner un administrateur

Impossible depuis le site — c'est volontaire. Dans l'éditeur SQL de Supabase :

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'adresse@exemple.com');
```

### Deux avertissements attendus dans l'audit Supabase

L'audit signale que `is_admin()` et `admin_set_verified()` sont des fonctions
`SECURITY DEFINER` appelables par un membre connecté. C'est **voulu** :

- `is_admin()` doit être exécutable par le rôle `authenticated`, sinon les
  règles de sécurité qui l'utilisent ne peuvent pas être évaluées.
- `admin_set_verified()` est justement le seul chemin permettant de poser le
  badge, puisque la colonne est interdite en écriture à tout le monde. La
  fonction vérifie elle-même que l'appelant est administrateur.

Les deux comportements ont été testés en base en se faisant passer pour un
membre ordinaire : la pose du badge est refusée, et une annonce retirée reste
invisible.

### Deux garde-fous à ne pas retirer

- `revoke update on public.profiles ... grant update (first_name)` : sans
  cela, n'importe quel membre pourrait se déclarer « identité vérifiée ».
- Aucune politique d'écriture ne permet de toucher aux publications d'autrui :
  toutes sont conditionnées à `auth.uid() = user_id`.

## Contrôle du médicament par un pharmacien (`/pharmacien`)

Le badge « identité vérifiée » atteste de la **personne**. Il ne dit rien sur
le **médicament** lui-même — bon produit, bon dosage, date de péremption
encore valable. C'est ce que ce second rôle couvre, indépendamment du
premier.

Un compte marqué pharmacien voit dans `/pharmacien` la liste des dons en
ligne, et peut y poser ou retirer un badge « médicament contrôlé »
(`components/MedicationVerifiedBadge.tsx`), affiché sur l'annonce à côté du
badge d'identité. Comme pour `/admin`, la page répond « introuvable » à qui
n'a pas ce rôle.

### Désigner un pharmacien

Impossible depuis le site, volontairement — même principe que pour
`is_admin` :

```sql
update public.profiles set is_pharmacist = true
where id = (select id from auth.users where email = 'adresse@exemple.com');
```

La colonne `listings.medication_verified` est interdite en écriture directe
à tout le monde, auteur de l'annonce compris (migration
`0006_pharmacien.sql` restreint désormais l'écriture sur `listings` à la
seule colonne `status`) : seule la fonction `pharmacist_set_medication_verified`,
qui revérifie elle-même le rôle de l'appelant, peut la modifier.

## Catégories d'annonces

Une annonce ne porte plus uniquement sur un médicament : à la publication,
chacun choisit une catégorie — **Médicament**, **Matériel d'incontinence**
(poches, sondes, alèses…), **Dispositif médical** (tensiomètre, glucomètre,
nébuliseur, fauteuil roulant…), **Compléments & vitamines**, **Matériel de
soins** (pansements, seringues…) ou **Autre**. La catégorie est filtrable
sur `/annonces` et affichée en badge sur chaque annonce (voir
`lib/types.ts` → `LISTING_CATEGORY_LABEL`).

Les annonces publiées avant cette version sont classées "Médicament" par
défaut (`supabase/migrations/0005_categories.sql`), ce qui correspond à
leur contenu réel jusqu'ici — aucune donnée n'a été perdue ou déplacée.

## Site bilingue (français / arabe)

Le site entier — pages publiques, publication, compte, admin — est
disponible en français et en arabe, avec un bouton de bascule (Nav et
Footer). Le choix est mémorisé un an dans un cookie (`dawaana_locale`), pas
dans l'URL : c'est un choix délibéré pour ne jamais toucher à
`app/auth/callback/route.ts`, dont l'URL est déjà enregistrée dans la
configuration Supabase (Redirect URLs) — un préfixe `/fr/`or `/ar/` sur
toutes les routes aurait cassé ce lien.

Comment ça marche :

- `lib/i18n/locale.ts` lit la langue depuis le cookie (`getLocale()`) et
  calcule le sens d'écriture (`dirOf()` → `rtl` pour l'arabe).
- `lib/i18n/dictionary.ts` contient tous les textes de l'interface, en
  français et en arabe, sous forme d'objets TypeScript synchrones (pas de
  chargement dynamique) — importables aussi bien dans les composants
  serveur que client.
- `lib/i18n/labels.ts` traduit à l'affichage les noms de wilaya et de pays
  (58 wilayas, ~21 pays). **La valeur stockée en base et utilisée pour les
  filtres reste toujours le libellé français** — seul l'affichage change
  avec la langue, pour ne jamais dérégler les annonces déjà publiées.
- `app/layout.tsx` pose `<html lang dir>` dynamiquement et charge la police
  Cairo (arabe) en plus de Sora/IBM Plex Sans.
- `components/LangSwitcher.tsx` change le cookie via une Server Action puis
  rafraîchit la page.

Limite assumée : le passage en arabe déclenche l'écriture de droite à
gauche (`dir="rtl"`), et la plupart des mises en page (`flex` par défaut)
s'inversent automatiquement — mais ce n'est pas un travail RTL
pixel-parfait. Quelques détails mineurs (icônes flèche non retournées dans
un texte, alignement fin de certains badges) peuvent rester imparfaits ;
signalez-les si vous en repérez.

## Choix structurant sur l'identité

La vérification d'identité **ne stocke aucune pièce d'identité, aucun selfie
et aucun numéro de téléphone** dans cette base. Le principe retenu : un
prestataire externe fait le contrôle et ne renvoie qu'un booléen.

Motif : la loi 25-11 du 24 juillet 2025 classe ces données en traitement à
haut risque (consentement explicite ou autorisation ANPDP, analyse d'impact
préalable, DPO désigné, notification de fuite sous 5 jours, sanctions
pénales possibles). Une plateforme santé tenue par des bénévoles n'a pas à
en devenir le dépositaire.

Deuxième principe : **vérifier n'est pas afficher.** Une annonce de
recherche révèle un besoin de santé ; publier le nom complet du demandeur à
côté reviendrait à publier une donnée de santé nominative. D'où le prénom
seul côté demandeur.

## Ce qui n'est PAS encore fait

- Pas de vraie messagerie sécurisée entre demandeur et donateur (le bouton
  "Je peux aider" affiche pour l'instant un message d'attente — voir
  `components/HelpButton.tsx`)
- La vérification d'identité n'est pas branchée : aucun prestataire n'est
  connecté, le badge n'apparaît donc sur aucune annonce
- Le rôle pharmacien (`/pharmacien`) ne couvre que le contrôle du
  médicament sur les dons déjà en ligne — pas encore de recrutement ni
  d'annuaire des pharmaciens bénévoles ; le réseau reste à constituer
- Pas de version arabe (RTL) de cette version codée — seule la maquette
  visuelle existe en arabe pour l'instant
- Pas de modération automatique des annonces
- **Transport de médicament pour le compte d'un tiers : non implémenté, et
  volontairement.** La réglementation douanière algérienne exige qu'un
  médicament transporté soit étiqueté au nom du voyageur et accompagné de
  son ordonnance. Le carnet de voyages sert donc à se coordonner, pas à
  confier un colis. À rouvrir seulement après avis juridique.

## Tester sur téléphone (PWA / APK)

L'application est installable sur Android : `public/manifest.webmanifest`,
icônes, service worker minimal (`public/sw.js`) et barre d'onglets mobile
sont en place. Une fois le site déployé en HTTPS, Chrome propose
« Ajouter à l'écran d'accueil » et l'app s'ouvre en plein écran, sans
barre de navigateur.

Le service worker ne met **pas** les pages en cache, volontairement : une
demande de médicament périmée est pire qu'une erreur réseau. Il ne sert
qu'à l'installabilité et à la page hors-ligne.

**Pour un vrai fichier `.apk`**, la voie normale est un TWA généré avec
Bubblewrap, sur une machine disposant du SDK Android :

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://VOTRE-DOMAINE/manifest.webmanifest
bubblewrap build
```

Cela suppose que le site soit d'abord en ligne en HTTPS : l'application est
rendue côté serveur, elle ne peut pas être empaquetée hors ligne sans être
entièrement réécrite.

## Formalités à accomplir avant une mise en ligne publique

Les passages surlignés en rouge sur `/confidentialite` marquent ce qui
reste à compléter :

- identité et adresse du responsable du traitement
- adresse e-mail de contact pour l'exercice des droits
- durée de conservation après retrait d'une annonce
- désignation d'un DPO et analyse d'impact (exigées par la loi 25-11)
- formalités de transfert hors d'Algérie : la base est hébergée en Irlande

## Démarrer en local

```bash
npm install
cp .env.local.example .env.local   # puis remplissez avec vos clés Supabase
npm run dev
```

Ouvrez http://localhost:3000 — sans les clés Supabase renseignées,
l'app se lance quand même (les listes sont vides et le formulaire
affiche un message clair au lieu de planter).

## Connecter la base de données Supabase

1. Créez un projet sur [supabase.com](https://supabase.com) (ou utilisez
   un projet existant).
2. Appliquez le schéma dans `supabase/migrations/0001_init.sql` — soit en
   le collant dans le SQL Editor du tableau de bord Supabase, soit via la
   CLI Supabase (`supabase db push`).
3. Copiez l'URL du projet et la clé publique (**Project Settings → API**)
   dans `.env.local`.

## Déployer

Le plus simple est [Vercel](https://vercel.com) :

1. Poussez ce dossier sur un dépôt GitHub.
2. Importez le dépôt sur Vercel.
3. Renseignez les deux variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans les réglages du projet Vercel.
4. Déployez — Vercel détecte Next.js automatiquement.

## Structure du projet

```
app/
  page.tsx              accueil
  annonces/page.tsx      liste + filtres
  annonces/[id]/page.tsx détail d'une annonce
  publier/page.tsx       formulaire de publication
components/               composants réutilisables (cartes, nav, icônes…)
lib/                       client Supabase, types, wilayas, utilitaires
supabase/migrations/       schéma SQL de la base de données
```

## Prochaines étapes suggérées

- Brancher une vraie messagerie sécurisée (ou, plus simple pour commencer,
  un webhook vers un groupe Telegram/WhatsApp des bénévoles)
- Ajouter un tableau de bord simple pour les pharmaciens bénévoles
  (lister les annonces à vérifier, marquer "vérifié"/"rejeté")
- Ajouter la version arabe (RTL) de cette application codée
- Mettre en place une vraie modération (rôle admin, Supabase Auth)
