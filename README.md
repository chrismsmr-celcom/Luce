# Luce — frontend

Interface web de **Luce**, l'assistant qui lit tes outils et **prépare le travail avant que tu le demandes**.
Stack : TanStack Start + React 19, Tailwind, shadcn/ui, TanStack Query, Supabase Auth.

> Backend : [luce-backend](https://github.com/chrismsmr-celcom/luce-backend) (Flask + Composio + Cerbère).

## Écrans

| Route | Contenu |
|---|---|
| `/login` | Connexion par e-mail (Supabase) |
| `/` | **Aujourd'hui** : priorités Gmail, agenda du jour, propositions à valider |
| `/inbox` | Mails Gmail : rendu façon Gmail (HTML nettoyé, images bloquées par défaut), pièces jointes (PDF, images, vidéos, audio, texte) |
| `/artefacts` | Réponses, résumés, rappels et alertes préparés par Luce — « Valider » crée le brouillon Gmail |
| `/dossiers` | Fichiers Google Drive récents |
| `/connexions` | Connexion des outils (OAuth Composio) |
| `/notebook` | Notes locales au navigateur |
| `/parametres` | Niveau d'autonomie, compte |

## Démarrage

```sh
bun install            # ou npm install
bun run dev            # serveur de développement Vite
bun run build
bun run test
```

Crée un fichier `.env` :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://luce-backend.vercel.app   # URL du backend, sans slash final
```

En production (Vercel), ces variables doivent être définies pour **Production** puis le projet **redéployé** :
les variables `VITE_*` sont figées au moment du build. Sans les variables Supabase, l'app passe en « mode
local » et ne demande pas de connexion.

## Organisation

```
src/
├── routes/                 pages (TanStack Router, fichiers = routes)
├── components/luce/        app-shell, mail-body (rendu mail), attachment-viewer (aperçu des pièces jointes)
├── components/ui/          composants shadcn/ui
├── lib/
│   ├── api.ts              client du backend (jeton Supabase, blobs de pièces jointes)
│   ├── auth.ts, supabase.ts
│   ├── luce-data.ts        hooks de données réelles (inbox, agenda, fichiers) + formatage
│   └── luce-store.ts       état local (connexions, réglages, notes)
└── test/                   tests Vitest
```

## Sécurité côté interface

- Le HTML des mails est nettoyé (**DOMPurify**) puis affiché dans une iframe **sans script**, avec une CSP qui
  bloque tout contenu distant tant que tu n'as pas cliqué sur « Afficher ».
- Les pièces jointes sont téléchargées avec le jeton (pas de lien public) et affichées depuis un blob local.
- Les actions préparées par Luce ne partent jamais sans ton clic.

## Déploiement

Projet Vercel pointant sur ce dépôt. Vérifie que le backend autorise ton domaine (`FRONTEND_ORIGINS`) :
`https://<backend>/api/health` doit lister `cors_origins`.
