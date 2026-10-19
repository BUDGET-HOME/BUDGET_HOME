# Améliorations — BUDGET_HOME

Revue du code et des fonctionnalités (octobre 2026).

L’application est un Next.js 16 (App Router) avec deux espaces : le budget du foyer (`/`) et la gestion entreprise (`/entreprise`). Les calculs de budget et de crédit sont extraits dans `src/lib/` et couverts par Vitest. L’authentification et la sauvegarde du budget passent par Supabase. Ce document liste ce qu’il reste à corriger ou à construire.

Priorités :

- **P0** — comportement faux, perte de données, ou exposition de données personnelles.
- **P1** — fonctionnalité annoncée absente, ou parcours qui s’arrête.
- **P2** — fiabilité des simulateurs, ergonomie, accessibilité.
- **P3** — dette technique, tests, documentation.

Chaque entrée a un identifiant stable (`A-…`) pour pouvoir la cocher dans une PR.

---

## Déjà en place

À ne pas replanifier comme du travail neuf :

- Projet Next.js, composants foyer (`Header`, `RevenusCard`, `DepensesForm`, `AnalyseCard`, `LoanCard`, `ChargesTable`, `ChartsCard`).
- Calculs purs : ratio, annualisation, verdict, échéancier, TAEG, projection de remboursement anticipé (`src/lib/budget.ts`, `src/lib/loan.ts`).
- Auth Supabase : inscription, connexion, déconnexion, proxy de session (`src/proxy.ts`).
- Table `budgets` avec RLS (`supabase/migrations/001_budgets.sql`) et API `GET`/`PUT /api/budget`.
- Sauvegarde locale + debounce 2 s vers le serveur quand une session existe (`src/hooks/useBudget.ts`).
- Import JSON normalisé (`normalizeState`) et tests unitaires sur budget, crédit, statuts et lancement.

Le fichier `plan.md` coche encore toutes les tâches comme ouvertes. Le mettre à jour en même temps que ce document (voir A-40).

---

## P0 — Correctifs bloquants

### A-01 — L’export et l’import ne sont plus accessibles

`exportJSON` et `onImport` existent, et `BudgetApp` prépare bien l’import. `Header` et `EntrepriseHeader` reçoivent ces props sans les afficher : aucun bouton Exporter, aucun sélecteur de fichier. Côté entreprise, `handleImport` se contente d’un `alert` « à implémenter ».

Piste : boutons Exporter / Importer dans un en-tête partagé ; après import, appeler la même sauvegarde serveur que `update`.

Fichiers : `src/components/Header.tsx`, `src/components/entreprise/EntrepriseHeader.tsx`, `src/components/BudgetApp.tsx`, `src/components/entreprise/EntrepriseApp.tsx`, `src/lib/budget-service.ts`.

### A-02 — Un import de l’ancien JSON efface les salaires

`budget_v6_2025-12-15.json` (et tout export où `salary1` / `salary2` sont des nombres) passe par `str()`, qui n’accepte qu’une chaîne non vide. Un nombre retombe sur la valeur par défaut, donc salaire vide. Les dépenses, elles, acceptent un nombre via `num()`.

Piste : accepter `number | string` pour les salaires, conserver `""` seulement si la valeur est absente.

Fichiers : `src/lib/budget-service.ts`, `src/lib/budget-service.test.ts`.

### A-03 — L’import connecté ne part pas vers le serveur

`replaceState` écrit le `localStorage` et s’arrête. Le `PUT /api/budget` n’est déclenché que par `update`. Un fichier importé sur un compte connecté disparaît au prochain chargement si le serveur a déjà une ligne, ou n’est jamais créé s’il n’y en a pas.

Piste : `replaceState` doit planifier `saveNow` comme `update`.

Fichier : `src/hooks/useBudget.ts`.

### A-04 — Le crédit fausse le verdict « qui doit quoi à qui »

`computeBalance` ajoute la mensualité du crédit au total à répartir, sans l’ajouter à `displayPaid1` ni `displayPaid2`. En comptes séparés, personne n’est crédité du paiement réel. Le solde de la personne 1 baisse d’autant que sa part théorique du crédit, même si le prélèvement est déjà sur son compte. Le tableau des charges affiche pourtant le crédit comme « Commun ».

En vue annuelle, la mensualité retenue est celle du premier mois × 12. L’assurance sur capital restant dû baisse chaque mois : le coût annuel et la capacité d’épargne sont donc surévalués côté charges.

Piste : choisir un payeur (personne 1, personne 2, ou 50/50) et l’inclure dans les montants payés ; pour l’année, sommer l’échéancier réel plutôt que extrapoler le mois 1. Aligner le libellé « Top catégories (dont crédit maison) » de `AnalyseCard`, qui n’inclut pas le crédit aujourd’hui.

Fichiers : `src/lib/budget.ts`, `src/components/AnalyseCard.tsx`, `src/components/ChargesTable.tsx`.

### A-05 — Le reset mot de passe ne permet pas d’en choisir un nouveau

`/reset` appelle `resetPasswordForEmail` avec `redirectTo` vers `/login`. Il n’existe pas de page qui lit la session de recovery et appelle `updateUser({ password })`. Le lien reçu par email ramène à l’écran de connexion.

Piste : page `/update-password`, `redirectTo` pointant vers elle, formulaire nouveau mot de passe + confirmation, message d’erreur si le lien est expiré.

Fichiers : `src/app/reset/page.tsx`, nouvelle route `src/app/update-password/page.tsx`.

### A-06 — Données personnelles dans le dépôt

`DEFAULT_STATE` porte les prénoms du foyer et les paramètres du crédit réel (capital, mensualité, frais, taux d’assurance). Le même jeu de chiffres est commenté dans `src/lib/loan.test.ts` avec un numéro d’offre. `budget_v6_2025-12-15.json` contient salaires et postes de dépenses identifiables.

Piste : défauts neutres (prénoms génériques, crédit à zéro). Garder le scénario bancaire uniquement dans les tests, sans numéro d’offre. Retirer ou anonymiser le JSON d’exemple, et vérifier l’historique git si ces fichiers ont déjà été poussés.

Fichiers : `src/lib/types.ts`, `src/lib/loan.test.ts`, `budget_v6_2025-12-15.json`.

### A-07 — Les simulateurs entreprise n’ont pas de schéma SQL

Seul `public.budgets` est migré. Les hooks lisent et écrivent `freelance_simulator`, `gantt_simulator` et les tables attendues par `useLaunchData`, `useRevenueData`, `useStatusCompareData`. Sans ces tables et sans RLS, la sauvegarde échoue en silence (`console.error`) pendant que l’UI continue sur des valeurs par défaut.

Piste : une migration par table, `user_id` unique, policies identiques à `budgets`, et un état d’erreur visible (pas seulement la console).

Fichiers : `supabase/migrations/`, `src/hooks/useFreelanceData.ts`, `src/hooks/useGanttData.ts`, `src/hooks/useLaunchData.ts`, `src/hooks/useRevenueData.ts`, `src/hooks/useStatusCompareData.ts`.

### A-08 — La ligne de budget mise à jour n’est pas déterministe

`GET` prend la ligne la plus récente (`order updated_at desc`). `PUT` fait `limit(1)` sans tri. S’il existe deux lignes pour le même utilisateur, la lecture et l’écriture peuvent viser des enregistrements différents. La table n’a pas de contrainte d’unicité sur `user_id`, alors que l’API ne gère qu’un budget.

Piste : index unique sur `user_id` tant qu’il n’y a qu’un budget par compte, et le même `order` des deux côtés. Prévoir la levée de cette contrainte le jour du multi-budgets (A-18).

Fichiers : `src/app/api/budget/route.ts`, `supabase/migrations/001_budgets.sql`.

---

## P1 — Parcours produit

### A-09 — Mode visiteur annoncé, parcours fermé

`BudgetApp` affiche un bandeau « mode local, créez un compte ». Avec Supabase configuré, `updateSession` redirige toute page hors `/login`, `/signup`, `/reset` vers `/login`. Le bandeau n’est jamais vu. Sans variables d’environnement, `createClient()` est quand même appelé avec une URL vide : le mode local décrit dans le README ne démarre pas.

Piste : trancher le produit. Soit le foyer reste utilisable hors connexion (proxy qui laisse passer `/` et `/entreprise`, client Supabase seulement si `isSupabaseConfigured()`). Soit le bandeau et le texte « mode visiteur » sortent de l’UI, et l’absence de config affiche un message explicite.

Fichiers : `src/lib/supabase/middleware.ts`, `src/hooks/useBudget.ts`, `src/components/BudgetApp.tsx`, `README.md`.

### A-10 — Premier login : pas de choix entre local et serveur

Si le compte a déjà un budget, le `localStorage` est ignoré. S’il n’en a pas, le local est affiché sans être envoyé au serveur tant que l’utilisateur ne modifie rien. Aucun écran ne propose « garder l’appareil » ou « garder le compte ».

Piste : à la première session, comparer les deux états et demander. Envoyer le choix retenu tout de suite.

Fichier : `src/hooks/useBudget.ts`.

### A-11 — Conflit multi-appareils

La stratégie prévue (dernier `updated_at` gagne) n’est pas implémentée. Chaque frappe debounce envoie l’état entier. Deux onglets ouverts s’écrasent. Le statut `offline` est déclaré dans `SyncStatus` et n’est jamais positionné. L’en-tête entreprise garde `syncStatus` à `idle` : les cartes sauvent chacune de leur côté sans remonter l’état.

Piste : envoyer `updated_at` connu, refuser le `PUT` s’il est plus ancien, proposer recharger ou écraser. Un contexte de synchro unique pour les outils entreprise. File d’attente si `navigator.onLine` est faux.

Fichiers : `src/app/api/budget/route.ts`, `src/hooks/useBudget.ts`, `src/components/entreprise/EntrepriseApp.tsx`.

### A-12 — Suppression de compte et des données

Le plan prévoit un bouton RGPD. Il n’existe pas : ni suppression du budget, ni des lignes simulateurs, ni du compte Auth.

Piste : action explicite, double confirmation, suppression des lignes `user_id` puis `auth.admin.deleteUser` côté serveur (service role uniquement, jamais dans le client).

### A-13 — Validation et taille du JSON serveur

`PUT` accepte tout objet. Pas de schéma, pas de plafond de taille. Une erreur Supabase est renvoyée telle quelle au navigateur (`error.message`).

Piste : valider avec la même fonction que l’import (`normalizeState` ou un schéma dédié), limiter le corps (quelques centaines de Ko), répondre par un code stable (`invalid_budget`, `save_failed`) sans message SQL.

Fichiers : `src/app/api/budget/route.ts`, `src/lib/budget-service.ts`.

### A-14 — Trésorerie uniquement dans le navigateur

`useCashFlowData` sérialise dans `localStorage` (`cashFlowData`). Les autres outils entreprise visent Supabase. Changer de navigateur perd le prévisionnel. `JSON.parse` n’est pas filtré : une valeur corrompue peut casser le rendu. L’ARCE (paramètres et case à cocher) vit dans des `useState` de `CashFlowPlannerCard` et repart à zéro au rechargement.

Piste : même table + RLS que les autres simulateurs, normalizer à la lecture, persister le bloc ARCE avec les lignes.

Fichiers : `src/hooks/useCashFlowData.ts`, `src/components/entreprise/CashFlowPlannerCard.tsx`.

### A-15 — Écrans entreprise écrits et jamais montés

`LaunchSimCard`, `RevenueSimCard` et `AuthWidget` ne sont importés par aucune page. `useStatusCompareData` n’a aucun appelant : `StatusCompareCard` recalcule à partir du simulateur freelance. L’onglet affiché est « Choix du statut », « Simulateur Freelance », « Planning », « Trésorerie ».

Piste : soit brancher le lancement et le chiffre d’affaires dans `TOOLS`, soit supprimer le code mort pour qu’il ne dérive pas. Fusionner `AuthWidget` avec `/login` (les deux formulaires divergent déjà).

Fichiers : `src/components/entreprise/EntrepriseApp.tsx`, `src/components/entreprise/LaunchSimCard.tsx`, `src/components/entreprise/RevenueSimCard.tsx`, `src/components/AuthWidget.tsx`, `src/hooks/useStatusCompareData.ts`.

### A-16 — Le simulateur immobilier a disparu de l’UI et reste dans le modèle

`ImmoSettings` est encore dans `BudgetState`, normalisé, testé, et cité par le titre de page (« Budget & Projet Immo »). Aucune carte ne le saisit. Le README décrit encore plafond 35 %, reste à vivre et frais de notaire.

Piste : remettre une carte « Projet immo » branchée sur `state.immo`, ou retirer le champ du state, de l’export et des textes.

Fichiers : `src/lib/types.ts`, `src/app/layout.tsx`, `README.md`.

### A-17 — Catégories figées, identité fragile

Les 14 catégories sont des chaînes avec emoji (`CATEGORIES` dans `src/lib/types.ts`). Le tableau n’affiche que le premier mot (`split(" ")[0]`), donc seulement l’emoji. Renommer une catégorie casse l’historique. Pas de budget cible par catégorie, pas de catégorie ajoutée par l’utilisateur.

Piste : identifiant stable (`logement`, `energie`, …) + libellé affichable. Budget mensuel optionnel et écart réel / cible dans l’analyse.

### A-18 — Un seul budget par compte, sans historique

Le schéma a une colonne `name`, l’API n’en utilise pas. Pas de suivi mois par mois : chaque enregistrement est un instantané écrasé. Impossible de comparer janvier et octobre ou de garder un budget « maison » et un budget « essai ».

Piste : liste de budgets nommés, puis snapshots datés (table `budget_snapshots` ou historique dans le JSON versionné). La vue mensuelle actuelle reste un lissage annuel, pas un mois calendaire.

### A-19 — Édition des dépenses incomplète

On peut ajouter, modifier, supprimer, tout effacer (`confirm`). Manquent : annuler la suppression, dupliquer une ligne, rechercher, trier autrement que par catégorie, saisir une date de début / fin (abonnement), et une note. Les identifiants `Date.now()` peuvent entrer en collision si deux ajouts tombent dans la même milliseconde ; `normalizeState` régénère aussi des ids avec `Date.now() + i`.

Piste : `crypto.randomUUID()`, corbeille ou toast « Annuler », champs `start` / `end` optionnels ignorés par les anciens JSON.

Fichiers : `src/components/DepensesForm.tsx`, `src/components/ChargesTable.tsx`, `src/lib/budget-service.ts`.

### A-20 — Deux en-têtes et un état factice

`Header` et `EntrepriseHeader` répètent déconnexion, impression et libellés de synchro. `EntrepriseApp` fabrique un `BudgetState` vide uniquement pour satisfaire la prop `state`, qui n’est pas lue.

Piste : un composant d’en-tête paramétré par le titre et les actions. Retirer `state` de la signature entreprise.

---

## P2 — Calculs, interface, accessibilité

### A-21 — Barème entreprise : modèle pédagogique, pas un conseil

`src/lib/business.ts` fige des taux ronds (cotisations 45 % et 42 %, IS 15 %, flat tax 30 %, IR micro 6 % au-delà d’un seuil, salaire SASU/EURL fixé à 24 000 €). Les charges saisies sont annulées pour la micro (`exp * 0`). `RevenueSimInput.services` n’entre dans aucun calcul. `LaunchSim` applique un taux ACRE forfaitaire sur la moitié du plafond annuel de la Sécurité sociale, sans lien avec le CA saisi. Aucun écran ne date ces hypothèses ni n’avertit que ce n’est pas une simulation fiscale officielle.

Piste : bloc « Hypothèses au JJ/MM/AAAA » visible, sources (urssaf, service-public), paramètres éditables (rémunération du dirigeant, taux). Les tests doivent verrouiller les formules choisies et échouer quand une hypothèse change volontairement.

Fichiers : `src/lib/business.ts`, `src/lib/launch.ts`, `src/components/entreprise/StatusCompareCard.tsx`, `src/components/entreprise/FreelanceSimulatorCard.tsx`.

### A-22 — Zéro traité comme « valeur absente »

Les mappers `mapFromDb` utilisent `||` pour les nombres. Un TJM, un nombre de jours ou des parts fiscales à `0` redeviennent le défaut (480, 18, 1, …). Seuls les booléens passent par `??`.

Piste : `??` partout, et une fonction partagée plutôt que cinq copies (`useFreelanceData`, `useGanttData`, `useLaunchData`, `useRevenueData`, `useStatusCompareData`).

### A-23 — TAEG et remboursement anticipé

`computeTAEG` cherche le taux qui égalise la valeur actuelle des versements à `capital + frais`. Les frais d’entrée augmentent ainsi le montant considéré comme reçu, ce qui tire le TAEG vers le bas par rapport à la définition usuelle (montant net décaissé au départ). L’UI compare ce chiffre à l’offre avec un seuil de 0,15 point et un texte qui explique l’écart par l’assurance obligatoire : les deux causes se mélangent.

`projectLoan` compte les intérêts économisés, pas la baisse d’assurance, et ne modélise pas les indemnités de remboursement anticipé. Si le versement saisi est inférieur aux intérêts + assurance, `buildSchedule` peut produire un principal négatif et un capital qui réaugmente : seul le dernier mois est plafonné.

Piste : documenter la formule retenue à côté du résultat ; refuser ou signaler une mensualité qui ne couvre pas intérêts + assurance ; ajouter l’assurance économisée et un taux d’IRA optionnel dans la simulation.

Fichiers : `src/lib/loan.ts`, `src/components/LoanCard.tsx`.

### A-24 — Graphiques et barres d’équilibre

La barre « qui a payé » dans `AnalyseCard` donne à chaque personne une largeur `payé / max(payé)`. Les deux parts additionnées dépassent 100 % dès que les deux montants sont positifs : la barre déborde. La capacité d’épargne reste verte même quand elle est négative. `ChartsCard` recrée les graphiques Chart.js à chaque changement, et `computeLoanSummary` reconstruit l’échéancier complet dans plusieurs cartes au même rendu (`LoanCard`, `ChargesTable`, `ChartsCard`). `react-chartjs-2` n’est utilisé que par la trésorerie.

Piste : largeurs normalisées sur la somme ; couleur selon le signe ; un résumé de crédit mémoïsé au niveau de `BudgetApp` ; un seul wrapper de graphiques.

Fichiers : `src/components/AnalyseCard.tsx`, `src/components/ChartsCard.tsx`, `src/components/LoanCard.tsx`.

### A-25 — Planning de lancement plafonné à 24 mois

`GanttCard` dessine une grille fixe de 24 mois. La durée saisie n’est pas limitée par la fin de grille : la barre est coupée (`Math.min` sur la largeur et sur le libellé de fin). Les tâches par défaut tiennent tout juste (la dernière occupe le mois 24). Allonger le plan au-delà, par exemple une troisième année, disparaît sans message.

Piste : horizon égal au maximum entre 24 mois et la fin réelle des tâches, et un avertissement si une durée dépasse la grille affichée.

Fichiers : `src/components/entreprise/GanttCard.tsx`, `src/lib/gantt.ts`.

### A-26 — Navigation inutilisable sur petit écran

La barre latérale fait 240 px en permanence (`w-60`), sans repli. Le contenu du foyer est en `max-w-4xl` à côté. À 640 px, la zone utile devient très étroite. Le plan demandait une vérification à cette largeur. L’impression masque `.no-print` mais laisse les formulaires du crédit et n’ouvre pas les `<details>` de calcul.

Piste : barre repliable sous le breakpoint `md`, bouton menu, styles print qui ouvrent les détails de ratio et d’équilibre et masquent les champs de saisie.

Fichiers : `src/components/AppShell.tsx`, `src/app/globals.css`.

### A-27 — Accessibilité et saisie

Plusieurs libellés ne sont pas reliés à leur champ (`htmlFor` / `id`). Le reset des charges utilise `confirm()`, sans retour clavier riche ni annulation. Les payeurs se distinguent surtout par le bleu et le rose. Les montants sont des `type="number"`, peu adaptés au clavier français (virgule). Les salaires négatifs passent. Les pages login / signup sont rendues dans `AppShell`, donc avec le menu Budget / Entreprise alors que ces routes redirigent vers la connexion.

Piste : associer chaque label, dialogue de confirmation, texte en plus de la couleur, `inputMode="decimal"` et parse de la virgule, refus des montants négatifs là où ils n’ont pas de sens, layout d’auth sans menu applicatif.

### A-28 — Cohérence des statuts freelance

Le simulateur freelance démarre sur `status: "auto"`. Le modèle de statuts (`CompanyStatus`) ne connaît que `micro | ei | eurl | sasu`. La comparaison de statuts recalcule CA et charges en dupliquant la somme des postes au lieu de lire une fonction unique. Changer le CA dans « Choix du statut » ne revient pas dans le simulateur freelance.

Piste : un type de statut partagé, une fonction `annualRevenue(freelance)` / `monthlyCosts(freelance)` utilisée par les deux cartes, et un sens de synchronisation explicite.

### A-29 — PDF et impression

Le foyer appelle `window.print()`. Le simulateur freelance embarque `html2canvas` + `jsPDF` et avale l’échec dans un `console.error`. Les deux parcours n’ont pas le même résultat ni le même périmètre (une carte contre la page).

Piste : un export PDF unique, message visible en cas d’échec, et un essai sur les deux espaces.

Fichier : `src/components/entreprise/FreelanceSimulatorCard.tsx`.

### A-30 — Pages d’auth : erreurs et chargement

La connexion affiche toujours « Identifiants invalides », y compris si le réseau ou la confirmation d’email est en cause. L’inscription renvoie `error.message` brut de Supabase. Le reset affiche le succès même si l’appel a échoué (`await` sans lecture de `error`). Pas de `error.tsx` / `not-found.tsx`.

Piste : distinguer réseau, email non confirmé, identifiants ; message générique côté inscription ; afficher l’échec d’envoi du mail de reset.

Fichiers : `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/reset/page.tsx`.

---

## P3 — Qualité, sécurité opérationnelle, documentation

### A-31 — Trous de tests

Vitest couvre les fonctions pures de `src/lib/`. Il ne couvre pas :

- le debounce et le fait qu’une rafale n’envoie qu’une requête (prévu dans `plan.md`) ;
- `saveToServer` / `loadFromServer` et les codes 401, 400, 503 ;
- la RLS (compte A ne lit pas le compte B) ;
- les composants (Testing Library) et les parcours inscription → saisie → rechargement (Playwright) ;
- la trésorerie (index de mois, fréquences, ARCE) ;
- le mapping `0` des hooks entreprise.

`@vitest/coverage-v8` est installé, aucun script `test:coverage`, aucun seuil. L’objectif « coverage lib > 90 % » du plan n’est pas vérifié en CI. Il n’y a pas de dossier `.github/workflows`.

Piste : script de couverture sur `src/lib/**`, tests d’API avec un client Supabase mocké, un parcours Playwright sur le foyer, et un workflow qui lance `lint`, `test`, `build`.

### A-32 — Typage `any` et duplication des hooks

Les cinq hooks simulateurs répètent fetch / insert / update / `mapFromDb` / `mapToDb` avec `any`. Un champ oublié dans le mapper ne se voit pas à la compilation.

Piste : un `useUserRow<T>(table, schema)` générique, types générés depuis Supabase (`supabase gen types`).

### A-33 — Journaux

Les hooks entreprise loguent l’objet d’erreur Supabase complet. À éviter pour des données de budget. Un message court et un code suffisent ; le détail reste côté supervision si elle est ajoutée plus tard.

### A-34 — En-têtes HTTP et cookies

Pas de politique de sécurité de contenu, ni `X-Content-Type-Options`, ni référent strict dans `next.config.ts`. Vérifier que les cookies de session Supabase sont `Secure`, `HttpOnly`, `SameSite=Lax` sur le domaine de prod.

### A-35 — Grants SQL explicites

La migration active la RLS et les policies. Elle ne contient pas les `GRANT` vers `authenticated`. Selon les privilèges par défaut du projet Supabase, la table peut être inaccessible ou, à l’inverse, trop ouverte si un jour la RLS est désactivée par erreur. Les écrire dans la migration rend le comportement reproductible. Ajouter la même exigence pour les tables de A-07.

### A-36 — Dépendances mortes ou à justifier

`react-chartjs-2` ne sert qu’à la trésorerie alors que le foyer instancie Chart.js à la main. `html2canvas` et `jspdf` ne servent qu’au PDF freelance. Après A-24 et A-29, ne garder qu’une voie.

### A-37 — `cacheComponents` et session

`next.config.ts` active `cacheComponents` et `partialPrefetching`. Les pages foyer sont des Client Components, donc peu concernées, mais toute future page serveur qui lirait le budget devra refuser le cache statique (`cookies()`, `connection()`). Le noter avant d’ajouter un chargement serveur du budget.

### A-38 — README faux

Le README décrit encore un `index.html` sans dépendance, Chart.js via CDN, « aucune installation », et un déploiement du fichier statique. Les commandes npm et Supabase plus bas contredisent ce schéma. La feuille de route coche comme à faire des sujets déjà livrés (Next.js, auth, synchro).

Piste : réécrire l’architecture sur l’arbre `src/`, les deux espaces, les variables `.env.example`, et la commande de migration SQL. Pointer vers ce fichier pour la suite.

### A-39 — `plan.md` à réconcilier

Cocher ce qui est livré (T0, une partie de T1–T4 et T6.1–T6.2). Laisser ouvert, avec un renvoi vers les identifiants ici : T2.7 (A-09), T3.2–T3.3 (A-10, A-11), T4.1–T4.3 (A-01, A-02, A-13), T5.4 (A-12), T6.4–T6.11 (A-31).

### A-40 — Qualité de code signalée par le lint

`Header` et `EntrepriseHeader` déclarent `state`, `onImport` et `exportJSON` sans s’en servir. `EntrepriseApp.handleImport` ignore son argument. Ces avertissements disparaîtront avec A-01 ; en attendant, le lint doit passer en CI (A-31) pour ne plus accumuler d’imports morts.

### A-41 — Internationalisation et noms par défaut

L’interface est en français, ce qui correspond au foyer visé. Les défauts « Raphael » et « Sarah » donnent l’impression d’un compte déjà rempli. Des libellés du type « Personne 1 » / « Personne 2 », remplaçables dès le premier écran, suffisent. Un sélecteur de langue n’est pas nécessaire tant que le public reste francophone.

### A-42 — Lien foyer ↔ entreprise

Les deux espaces ne partagent que la session. Le revenu net du simulateur freelance ne peut pas devenir le salaire d’une personne du foyer, et la trésorerie ne voit pas les charges maison. Utile une fois A-14 et A-21 stabilisés : une action « reporter le net mensuel vers le salaire 1 (ou 2) », explicite, jamais automatique.

### A-43 — Scénarios de démo

Après anonymisation (A-06), un bouton « Charger un exemple » peut injecter un foyer fictif (deux salaires, dix charges, crédit rond) pour comprendre les graphiques sans saisie. Le fichier ne doit plus être la copie d’un vrai budget.

### A-44 — Observabilité minimale

Aucun suivi des échecs de `PUT /api/budget` ni des erreurs de tables manquantes. Un compteur d’échecs de synchro (et le statut déjà prévu à l’écran) suffit pour un outil familial ; pas besoin d’une stack complète au départ.

---

## Ordre de travail suggéré

1. A-06, A-02, A-04, A-08, A-05, A-01, A-03 — données justes et récupérables.
2. A-07, A-14, A-09, A-10 — la sauvegarde existe vraiment pour chaque écran.
3. A-13, A-12, A-11 — durcir l’API et le multi-appareil.
4. A-21, A-22, A-23 — hypothèses de calcul visibles et testées.
5. A-24 à A-30 — interface.
6. A-31 à A-40 — filet de tests, README, plan.
7. A-16, A-17, A-18, A-42, A-43 — évolutions produit une fois la base stable.

Les identifiants A-15, A-19, A-20, A-25 à A-28, A-32 à A-37, A-41 et A-44 se glissent dans les étapes 4 à 6 selon le fichier déjà ouvert.
