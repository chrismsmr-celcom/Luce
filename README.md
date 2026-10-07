# Luce — AI Chief of Staff

Luce reads and acts on your connected apps (Gmail, Calendar, Drive, Slack, GitHub…) through
[Composio](https://composio.dev), with every external action passing through the Cerbere/AgentGuard
security layer.

- **Backend** (`app.py`, `agent.py`, …): Flask JSON API + agent loop (DeepSeek → OpenRouter → Cerebras).
- **Frontend** (`src/`): TanStack Start + React, built with [Lovable](https://lovable.dev).

## Run locally

```sh
cp .env.example .env            # fill in the keys
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
python app.py                   # API on http://127.0.0.1:10000

# another terminal
bun install                     # or npm install
bun run dev                     # Vite proxies /api to Flask
```

## How the pieces talk

| Frontend | Backend |
| --- | --- |
| Command bar | `POST /api/chat` |
| Connexions page | `GET /api/connections`, `POST /api/connect/<toolkit>` (OAuth redirect → `/api/composio/callback`) |
| Paramètres → autonomy | `POST /api/settings` |
| Proposed actions (Confirmer / Refuser) | `POST /api/actions/<id>/confirm`, `/reject` |
| Delete my data | `POST /api/account/delete` |

All `POST /api/*` requests must send `X-Luce-Client: web` (CSRF guard); `src/lib/api.ts` does it.

### Autonomy is enforced server-side

- `ask`: any modifying tool call is queued; nothing runs until the user clicks **Confirmer**.
- `draft`: only draft-creation tools run; sending/publishing/deleting is queued.
- `auto`: Luce acts directly (Cerbere can still block or require approval).

Tools are classified by their Composio slug (`GMAIL_SEND_EMAIL` → write). Unknown verbs count as writes.

## Production

```sh
LUCE_ENV=production gunicorn -w 2 -b 0.0.0.0:$PORT app:app
```

- Serve the frontend and `/api` behind **one domain** (reverse proxy) — simplest and safest for cookies.
  Otherwise set `FRONTEND_ORIGINS` and `VITE_API_URL`.
- Put `LUCE_DB_PATH` on a persistent disk (the default file is lost on ephemeral hosts).
- The in-memory rate limiter is per worker; use Redis if you scale out.
- Identity is still an anonymous browser session. Add real sign-in before opening to the public.

## Tests

```sh
pytest            # backend
bun run test      # frontend
```
