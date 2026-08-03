# Ceylon Experiences — Guest Management System

Phase 1 scaffold (project setup, full Prisma data model, Super Admin auth,
RBAC, protected admin layout, dashboard) plus Phase 3 (the Excel Import
pipeline) are built. Guests, Hotels, Bookings, Tours, Transfers, Users,
Roles, and Settings/Profile are still placeholder pages wired into
navigation, ready for Phase 2/4 CRUD work.

## Excel Import

`/excel-import` is a 3-step wizard:

1. **Upload** — pick an `.xlsx`/`.xls` file (parsed in the browser with
   SheetJS) and choose a worksheet.
2. **Map & Preview** — pick the destination table (Guests, Hotels, Bookings,
   Tours, or Transfers), map each Excel column to a database field (auto-
   suggested from the header text — e.g. "Clients Name" → Guest, "Hotel
   check in date" → Check-in Date), preview the first 10 mapped rows, save
   the mapping as a reusable template, and choose how to handle duplicates
   (skip / update / create-only).
3. **Result** — row counts (imported / duplicate / failed) plus a
   downloadable CSV error report for any rows that failed validation.

For **Booking** imports, the "Guest (name)" and "Hotel (name)" columns are
matched or auto-created in the Guests/Hotels tables by name — no need to
import guests and hotels separately first. Duplicate detection uses passport
number for guests and booking reference for bookings, matching the spec.

`/import-history` lists every run with status and row counts; click through
for the per-row error detail and error CSV download.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
NextAuth (credentials) · Zod · SheetJS · Lucide React

## Setup

```bash
npm install
cp .env.example .env
# edit .env: DATABASE_URL, NEXTAUTH_SECRET, SUPER_ADMIN_* values

npx prisma migrate dev --name init
npx prisma db seed

npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.
Sign in with the `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` from your
`.env` (defaults: `superadmin` / `ChangeMe123!` — change this after first
login).

## Useful scripts

| Command                  | Purpose                                   |
|---------------------------|--------------------------------------------|
| `npm run dev`              | Start the dev server                       |
| `npm run build` / `start`  | Production build / run                     |
| `npm run prisma:migrate`   | Create/apply a dev migration               |
| `npm run prisma:deploy`    | Apply migrations in production             |
| `npm run prisma:seed`      | Re-run the seed script                     |
| `npm run prisma:studio`    | Browse the database visually               |

## Project structure

```
src/
  app/
    login/                 public login page
    (admin)/                protected route group (auth-gated in layout.tsx)
      dashboard/
      guests/ hotels/ bookings/ tours/ transfers/
      users/ roles/
      excel-import/ import-history/
      settings/ profile/
    api/auth/[...nextauth]/  NextAuth route handler
    api/imports/             run import, delete history entry, error CSV
    api/mappings/            saved column mapping templates
  components/
    layout/                 Sidebar, Topbar, AdminShell
    ui/                     StatCard, ModulePlaceholder
  lib/
    auth.ts                 NextAuth config (credentials, JWT session)
    prisma.ts                Prisma client singleton
    permissions.ts           requirePermission() server-side RBAC guard
    audit.ts                 logAudit() helper
    validation.ts             Zod schemas
    import-fields.ts          Per-destination field defs + header auto-match
    import-engine.ts          Server-side row validation + insert/update logic
prisma/
  schema.prisma             Full data model (Users/Roles/Permissions,
                             Guest/Hotel/Booking/Tour/Transfer,
                             ExcelImport/ImportError/SavedColumnMapping,
                             AuditLog)
  seed.ts                   Seeds SUPER_ADMIN/ADMIN/DATA_ENTRY roles,
                             permissions, and the default Super Admin user
```

## Roles seeded by default

- **SUPER_ADMIN** — full access to every module.
- **ADMIN** — full CRUD on Guests, Hotels, Bookings, Tours, Transfers.
- **DATA_ENTRY** — can view/create + import on those modules, no edit/delete.

Additional roles can be created later through the Roles and Permissions
module (Phase 2) — the schema already supports arbitrary custom roles with
per-module permission rows.

## Notes on what's implemented vs. scaffolded

- **Implemented:** project setup, full schema + migrations, seed script,
  Super Admin credential login, session handling, protected routes,
  role-permission model, audit log table + helper, responsive
  sidebar/topbar shell with light/dark mode, dashboard with real counts
  pulled from Postgres, and the full Excel Import pipeline (upload → map →
  validate → import → history → error reports) for all five destination
  tables.
- **Scaffolded (placeholder page, wired into nav, ready for Phase 2/4):**
  Guests, Hotels, Bookings, Tours, Transfers, Users, Roles and Permissions,
  System Settings, My Profile. These need list/search/CRUD pages built on
  top of the same schema, permissions, and audit primitives the import
  pipeline already uses — happy to do these next, module by module. Guests
  and Bookings would make the most sense first, since the Excel import
  already populates those tables.
