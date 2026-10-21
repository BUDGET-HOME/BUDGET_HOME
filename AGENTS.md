<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Vérification

Ne pas vérifier l'application dans le navigateur : pas d'ouverture de l'interface, pas de captures, pas d'enregistrement d'écran. Ne pas joindre de capture de page dans la réponse.

S'appuyer sur la CI (`.github/workflows/ci.yml`), qui exécute :

- `npm test`
- `npm run typecheck`

Lancer ces deux commandes localement avant de conclure. Ne pas ajouter `npm run lint` au pipeline tant que `eslint` n'est pas vert sur la base.

## Git

Pousser les commits directement sur `main`. Ne pas créer de branche et ne pas ouvrir de pull request.

Avant le push, lancer `npm test` et `npm run typecheck`. Ne pas attendre que la CI soit au vert.

## Base Supabase

Quand une modification change la structure de la base Supabase :

- Mettre à jour `supabase/migrations/001_budgets.sql` pour que le fichier décrive l'état complet de la base. Ne pas créer un autre fichier de migration.
- Dans la réponse, donner le SQL à exécuter sur la base déjà en place. Ce SQL doit pouvoir être collé dans l'éditeur SQL Supabase : il met à jour l'existant sans recréer les tables ni effacer les données.
