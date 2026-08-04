# PSP Accreditation — Frontend

Vite + React + TypeScript + Tailwind v4 frontend for the Laravel 8 accreditation API.

## Setup

```bash
npm install
cp .env.example .env      # point VITE_API_URL at your Laravel backend
npm run dev
```

Backend (in `C:\Users\llrey\Desktop\dev\accreditation`):

```bash
php artisan serve --port=8000
```

> If routes 404 unexpectedly, the route cache is stale:
> `php artisan route:clear && php artisan config:clear`

## Architecture

| Path | Purpose |
|---|---|
| `src/api/client.ts` | fetch wrapper, bearer token store, `ApiError` (parses Laravel 422 `errors`) |
| `src/api/types.ts` | TypeScript mirrors of the Eloquent models |
| `src/api/endpoints.ts` | one function per route in `routes/api.php` |
| `src/api/hooks.ts` | React Query hooks + `qk` query-key registry |
| `src/context/auth.tsx` | session, `/me` bootstrap, role normalisation |
| `src/pages/*` | one page per module |

## Endpoint coverage

All routes in `routes/api.php` are wired:

**Public** — `POST /login`, `POST /register/institution`, `POST /register/resident`,
`GET /institutions`, email verification + resend.

**Authenticated** — `GET /me`, `/dashboard`, `/pending-approval`, `/notifications`,
`POST /notifications/{id}/read`, `POST /logout`.

**Training Officer** — documents, consultants (+ documents), quizzes (+ results),
research papers, case logs, accreditations, training officers, residents,
transfers (request / incoming / accept / reject), rotations (+ assignments).

**Admin** — `/admin/pending`, `/admin/staff`, user approve/reject,
accreditation approve/reject, `PUT /admin/settings`.

## Backend behaviours the UI accounts for

- **Roles**: the DB holds a legacy lowercase `admin` alongside canonical `Admin`;
  `auth.tsx` normalises so both resolve to `Admin`.
- **Rotations** must span a whole calendar month — the form takes a month and
  derives `starts_at` / `ends_at`.
- **`checklist_snapshot`** is an array of `{ label, done }`, not an object.
- **Aggregates arrive as strings** (`"1"`, `"10.000000"`) and grouped keys can be
  `""` when the source column is null — the dashboard coerces and labels these.
- **Gating**: unverified or unapproved users are routed to `/pending`.

## Design system

Clinical Governance Standard — Deep Navy `#0F172A`, Secondary Blue `#2563EB`,
canvas `#F8FAFC`, white cards with 1px slate borders and no shadow.
Hanken Grotesk headings / Inter UI / JetBrains Mono for IDs, dates and numerics.
Responsive: sidebar becomes an overlay drawer under `lg`, grids collapse 4→2→1,
tables scroll horizontally.
