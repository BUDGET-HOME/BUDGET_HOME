# 📋 Plan d'amélioration : Comptes utilisateurs & sauvegarde serveur

## 🎯 Objectif

Permettre aux utilisateurs de **créer un compte** et de **sauvegarder leurs données** (budget, profils, configuration du simulateur immo) **sur le serveur**, tout en **conservant l'export/import JSON** existant.

Contraintes : application 100 % web, déployée sur **Vercel**.

---

## 🏗 Décisions techniques à valider

| Sujet | Recommandation | Alternatives |
|---|---|---|
| Framework | **Next.js** (App Router) — natif sur Vercel, API Routes intégrées | Vite + API Vercel séparées |
| Base de données | **Vercel Postgres** (Neon) ou **Supabase** | Vercel KV (Redis) |
| Authentification | **Supabase Auth** (simplicité, gestion session intégrée) | Auth.js, NextAuth, JWT maison |
| Hash des mots de passe | Géré par Supabase Auth (bcrypt) | bcrypt/argon2 si auth maison |
| Schéma données | Réutiliser le format `state` JSON existant (compatibilité import/export) | Nouveau schéma versionné |

> Le JSON utilisateur reste le « format pivot » : ce qui est exporté aujourd'hui doit pouvoir être importé par un autre compte demain.

---

## ✅ Tâches à réaliser

### Phase 0 — Mise en place du projet Next.js
- [ ] **T0.1** Initialiser un projet Next.js (`create-next-app`, TypeScript, App Router).
- [ ] **T0.2** Migrer le HTML/CSS/JS existant (`index.html`) vers la structure Next.js :
  - composants : `Header`, `RevenusCard`, `DepensesForm`, `AnalyseCard`, `ImmoCard`, `ChargesTable` ;
  - logique de calcul extraite dans des modules purs (`src/lib/budget.ts`, `src/lib/immo.ts`).
- [ ] **T0.3** Configurer le déploiement Vercel (variables d'environnement, commande build).
- [ ] **T0.4** Vérifier la parité fonctionnelle : tous les calculs et l'UI identiques à la version monopage.

### Phase 1 — Base de données
- [ ] **T1.1** Créer le schéma :
  ```sql
  users            -- géré par Supabase Auth (auth.users)
  budgets (
    id           uuid PK,
    user_id      uuid FK -> auth.users,
    name         text,
    data         jsonb,        -- l'objet `state` complet
    created_at   timestamptz,
    updated_at   timestamptz
  )
  ```
- [ ] **T1.2** Activer **RLS (Row Level Security)** : chaque utilisateur ne peut lire/écrire que ses propres budgets.
- [ ] **T1.3** Script de migration versionné + seed éventuel.

### Phase 2 — Authentification
- [ ] **T2.1** Installer et configurer Supabase Auth (client + clé publique en variables d'env).
- [ ] **T2.2** Page **d'inscription** : email + mot de passe (validation : longueur min 8, confirmation).
- [ ] **T2.3** Page **de connexion** + gestion des erreurs (identifiants invalides, réseau).
- [ ] **T2.4** Page **mot de passe oublié** (email de reset via Supabase).
- [ ] **T2.5** **Déconnexion** + bouton profil dans le header.
- [ ] **T2.6** Protection des routes : rediriger vers `/login` si non authentifié.
- [ ] **T2.7** Mode visiteur (utilisateur non connecté) : l'app fonctionne en local (localStorage) comme aujourd'hui, avec bandeau invitant à créer un compte.

### Phase 3 — Sauvegarde serveur
- [ ] **T3.1** **Sauvegarde automatique** (debounce ~2 s après modification) de l'objet `state` vers le serveur (`PUT /api/budget` ou SDK Supabase).
- [ ] **T3.2** **Chargement au login** : si un budget existe côté serveur, le proposer/le charger (sinon partir de zéro).
- [ ] **T3.3** Gestion des **conflits multi-appareils** : stratégie `updated_at` (last-write-wins) dans un premier temps.
- [ ] **T3.4** Indicateur visuel d'état de synchro : « Sauvegardé ✓ », « Sauvegarde… », « Erreur — réessayer ».
- [ ] **T3.5** Multi-budgets (optionnel, phase 2 du produit) : plusieurs budgets nommés par compte.

### Phase 4 — Conservation export/import JSON
- [ ] **T4.1** Garder le bouton **Export JSON** (nom de fichier avec date, comme aujourd'hui).
- [ ] **T4.2** L'**import JSON** doit : créer un budget côté serveur si connecté, ou remplir le localStorage si visiteur.
- [ ] **T4.3** Validation du fichier importé (schéma attendu, message d'erreur clair si invalide).
- [ ] **T4.4** Le bouton **Imprimer/PDF** reste fonctionnel hors ligne.

### Phase 5 — Sécurité & confidentialité
- [ ] **T5.1** Aucune donnée financière en clair dans les logs ; pas de secrets dans le repo (`.env.local` gitignoré).
- [ ] **T5.2** Clés Supabase : uniquement `anon key` côté client, `service_role` jamais exposée.
- [ ] **T5.3** Vérifier RLS par tests manuels (compte A ne voit pas le budget du compte B).
- [ ] **T5.4** Suppression de compte + données (RGPD) : bouton « Supprimer mon compte et mes données ».

### Phase 6 — Tests 🧪

#### Tests unitaires (Vitest)
- [ ] **T6.1** `lib/budget.ts` : calcul du ratio (proportionnel, 50/50 forcé, salaire nul), annualisation des dépenses, verdict d'équilibre (qui doit quoi à qui, cas équilibré, cas vide).
- [ ] **T6.2** `lib/immo.ts` : mensualité max (min 35 % / reste à vivre), montant empruntable, frais de notaire (ancien/neuf), coût total crédit, tableau d'amortissement (somme des principal = capital emprunté, reste dû → 0 à la fin).
- [ ] **T6.3** Validation du schéma JSON d'import/export (fichier valide, fichier corrompu, fichier d'une autre version).
- [ ] **T6.4** Debounce de sauvegarde (pas de requête avant 2 s, une seule requête après rafales de modifications).

#### Tests d'intégration (Playwright ou Testing Library)
- [ ] **T6.5** Parcours inscription → connexion → déconnexion.
- [ ] **T6.6** Modifier une dépense connecté → les données persistent après rechargement (serveur).
- [ ] **T6.7** Mode visiteur → données dans localStorage → création de compte → migration des données locales vers le serveur.
- [ ] **T6.8** Export JSON depuis un compte → import dans un autre compte → données cohérentes.
- [ ] **T6.9** RLS : requête directe à la DB avec le token du compte A ne retourne pas les budgets du compte B.

#### Tests manuels / E2E sur Vercel
- [ ] **T6.10** Preview deployment avant chaque merge sur `main`.
- [ ] **T6.11** Impression PDF et vue mobile (640 px) toujours fonctionnels.

---

## 📦 Livraison

| Phase | Livrable | Critère d'acceptation |
|---|---|---|
| 0 | Projet Next.js sur Vercel | App identique à l'actuelle, déployée |
| 1-2 | Comptes utilisateurs | Inscription/connexion/reset fonctionnels, RLS actif |
| 3-4 | Synchro serveur + JSON | Sauvegarde auto, multi-appareil, export/import OK |
| 5-6 | Sécurité + tests | Suite de tests verte, coverage lib > 90 % |

---

## ⚠️ Risques identifiés

- **Migration monopage → Next.js** : risque de régression visuelle/fonctionnelle → parité vérifiée en T0.4 avant d'ajouter des fonctionnalités.
- **Perte de données localStorage des utilisateurs actuels** : prévoir la migration automatique localStorage → serveur au premier login (T6.7).
- **Quotas Vercel/Supabase** (plan gratuit) : debounce et limites de taille de payload.
