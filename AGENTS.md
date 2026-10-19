<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Vérification

Ne pas vérifier l'application dans le navigateur : pas d'ouverture de l'interface, pas de captures, pas d'enregistrement d'écran.

S'appuyer sur la CI (`.github/workflows/ci.yml`), qui exécute :

- `npm test`
- `npm run typecheck`

Lancer ces deux commandes localement avant de conclure. Ne pas ajouter `npm run lint` au pipeline tant que `eslint` n'est pas vert sur la base.

## Git

Pousser les commits directement sur `main`. Ne pas créer de branche et ne pas ouvrir de pull request.

Avant le push, lancer `npm test` et `npm run typecheck`. Après le push, vérifier que le workflow CI sur `main` est vert. S'il échoue, corriger et pousser à nouveau jusqu'à ce qu'il le soit.
