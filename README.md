# ⚔ Precon League

A clean, self-hostable web app for running a **Magic: The Gathering preconstructed Commander league** with your friends. Players get profiles, upload their precon decklists, upgrade them within a configurable budget (validated live against league rules), record four-player games, and climb the standings.

Card art, names, color identity, and **pricing all come from the [Scryfall API](https://scryfall.com/docs/api)**.

---

## Features

- **Profiles & auth** — email/password accounts with avatars and bios. The first account (or a configured admin email) becomes the league admin.
- **Deck import** — paste a decklist (Moxfield / Archidekt / MTGO format) **or** import from a Moxfield URL. Every card is resolved through Scryfall and cached locally.
- **Deck editor** — search Scryfall to add cards, set your commander, and watch the rules validate **as you type**.
- **Budget & rule validation** — the original precon is your free baseline; only cards you add count against the upgrade budget (default **$15**, priced from Scryfall). Color-identity lock, singleton, banned cards, deck size, and commander requirements are all enforced.
- **Matches & standings** — record 2–8 player pods with placements; standings (points / wins / win % / average finish) update automatically.
- **Admin panel** — configure the budget, toggles, banned list, and per-placement scoring. Refresh all card prices from Scryfall on demand.
- **Polished dark UI** built with Tailwind, responsive on mobile.

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Auth | Custom JWT sessions (`jose` + `bcryptjs`), httpOnly cookies |
| External data | Scryfall API (rate-limited + cached) |
| Deploy | Docker + docker-compose |

---

## Quick start (Docker — recommended)

You only need Docker and docker-compose.

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and set a strong AUTH_SECRET:
#   openssl rand -base64 32
# Optionally set ADMIN_EMAIL to the email you'll register with.

# 2. Build & run (app + Postgres)
docker compose up -d --build

# 3. Open the app
open http://localhost:3000
```

Migrations run automatically on boot. Register your account first — it becomes the admin. Data persists in the `postgres-data` Docker volume.

### Useful commands

```bash
docker compose logs -f app      # tail app logs
docker compose down             # stop (keeps data)
docker compose down -v          # stop and DELETE the database volume
```

---

## Local development (without Docker)

Requires Node 20+ and a PostgreSQL instance.

```bash
npm install
cp .env.example .env            # point DATABASE_URL at your Postgres

npx prisma migrate deploy       # or: npx prisma migrate dev
npm run db:seed                 # optional: creates the league defaults

npm run dev                     # http://localhost:3000
```

Handy scripts: `npm run build`, `npm run start`, `npm run typecheck`, `npm run db:reset`.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `AUTH_SECRET` | ✅ | Long random string used to sign session tokens. |
| `COOKIE_SECURE` | – | Set to `true` to mark the session cookie `Secure` (HTTPS-only). Leave unset/`false` when serving over plain HTTP on a LAN (e.g. `http://192.168.x.x:3000`), otherwise browsers drop the login cookie. |
| `SCRYFALL_USER_AGENT` | – | Identifies the app to Scryfall (they ask API users to set one). |
| `ADMIN_EMAIL` | – | This email is granted admin on registration. The very first account is always admin too. |

For docker-compose you can also set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `APP_PORT` in `.env`.

---

## How the upgrade budget works

When you import a deck, that exact list is stored as the deck's **immutable baseline** (the original precon). After that:

- **Removing** a baseline card is free.
- **Adding** any card that wasn't in the baseline counts its Scryfall price toward your budget.
- **Re-adding** an original card is always free again.

The deck editor blocks saving while any hard rule is broken, and the deck page shows a live "Rules check" with budget usage. Prices come from Scryfall and can be refreshed by an admin at any time (Admin → *Refresh card prices*).

---

## Notes

- **Moxfield imports** can be blocked by Moxfield's API (it often rejects server-side requests). When that happens the app tells you to use *Export → plain text* and paste instead — that path is 100% reliable.
- **Scryfall etiquette**: outbound calls are serialized with a ~100ms delay and results are cached in the `CardCache` table, so the app stays well within Scryfall's guidelines.
- This project is unofficial Fan Content and is **not affiliated with or endorsed by Wizards of the Coast or Scryfall**.

### Security

The app pins **Next.js 14.2.x**. A few low-severity self-hosted DoS advisories currently only have fixes in Next 16 (a major upgrade); they're not relevant to a small private league behind a login, so the upgrade is deferred. Bump with `npm install next@16` if you'd rather be on the latest.
