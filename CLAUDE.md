# Torque & Tension — Pilates PWA

## Stack

- **Frontend**: React 18 + Vite 5, Tailwind CSS, React Router v6
- **Backend**: Node.js + Express on port 3001, better-sqlite3
- **PWA**: `vite-plugin-pwa` with `injectManifest` strategy (custom `src/sw.js` required for push events)
- **Auth**: Single shared-password JWT gate (bcrypt + jsonwebtoken, 30-day tokens)
- **Push**: web-push (VAPID) + node-cron, server sends at user-scheduled times
- **Hosting**: IONOS, nginx reverse proxy, PM2 for server process

## Repo layout

```
client/       React app (Vite build → client/dist/)
server/       Express API
data/         exercises.csv + data/photos/ (source photos; .gitignored)
nginx.conf    Production nginx config
deploy.sh     Build + copy script
```

## Dev setup

```bash
# From repo root
npm install          # installs all workspaces
npm run dev          # starts client (:5173) and server (:3001) concurrently
```

Client proxies `/api/*` to `http://localhost:3001` via Vite config.

## Database

SQLite file at `server/pilates.db` (WAL mode). Schema auto-runs on server start.

```bash
node server/db/seed.js   # imports data/exercises.csv → SQLite + copies photos
```

Photos are copied from `data/photos/` to `client/public/images/` during seed. The `IMAGES_DIR` env var overrides the destination.

## Environment

Server reads `.env` at repo root:

```
APP_PASSWORD=<bcrypt hash of the shared password>
JWT_SECRET=<random 64-char string>
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
```

Generate VAPID keys: `cd server && node -e "const wp=require('web-push');console.log(JSON.stringify(wp.generateVAPIDKeys()))"`

Generate bcrypt hash: `cd server && node -e "const b=require('bcrypt');b.hash('yourpassword',10).then(console.log)"`

## API routes

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Returns JWT |
| GET | /api/exercises | Filter by body_part, difficulty, ease, duration |
| GET | /api/exercises/suggest | Workout generator — ?duration=20&difficulty=Medium&body_parts=Core,Glutes |
| GET | /api/exercises/body-parts | Distinct body part values |
| GET | /api/exercises/:id | Single exercise |
| POST | /api/exercises | Create (multipart/form-data with photos) |
| PUT | /api/exercises/:id | Update (multipart, supports remove_photos JSON array) |
| DELETE | /api/exercises/:id | Delete + remove photos from disk |
| GET | /api/sessions | All sessions; ?date=YYYY-MM-DD to filter |
| POST | /api/sessions | Create session + link exercises |
| PATCH | /api/sessions/:id/exercises | Append exercise_ids to existing session |
| DELETE | /api/sessions/:id | Delete session (cascade) |
| POST | /api/push/subscribe | Store push subscription + schedule |
| PUT | /api/push/subscribe | Update schedule |
| DELETE | /api/push/subscribe | Remove subscription |
| POST | /api/push/test | Send immediate test push |

## Key constraints

- `GET /api/exercises/suggest` must be defined **before** `GET /api/exercises/:id` in the router — the `:id` wildcard would otherwise swallow "suggest".
- `sw.js` must be served with `Cache-Control: no-cache` (nginx handles this in production; Vite handles it in dev).
- PWA uses `injectManifest` strategy so the service worker can handle custom `push` events. `self.__WB_MANIFEST` must appear in `src/sw.js`.
- Exercise photos stored as JSON array string in `photo_filenames` column (e.g. `["1234_foo.jpg","1235_bar.jpg"]`).

## Build + deploy

```bash
npm run build          # builds client/dist/
# Then on the server: copy dist, restart PM2
pm2 restart torque-tension
```

## CSV format

`data/exercises.csv` columns: `Card Number, Name, Difficulty, Photo Filenames, Time, Sets, Reps, Instructions`

- `Photo Filenames`: semicolon-separated list of filenames matching files in `data/photos/`
- `Difficulty`: Easy / Medium / Hard → mapped to ease_level 2 / 3 / 4
- `Time`: duration in minutes
