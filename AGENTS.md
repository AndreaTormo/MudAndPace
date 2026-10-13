# AGENTS.md

Trail running monorepo (course project, docs in Spanish). Two **independent** npm projects, no root
`package.json`, no workspace config, not a git repo. Run every command from inside a project folder.

```text
trail-running-api_v3/trail-running-api/           Express + Mongoose API (CommonJS, JS)
trail_running_frontend_v3/                        Angular 18 app (TypeScript, standalone)
```

An older, divergent copy of the API lives outside this tree at `../trail-running-api_v2` (different
status enum `draft|published`, has `npm run migrate:v2` and a jest suite). Do not pull changes from
it into this API unless asked; the schemas here are already the "v2" soft-delete variant.

## Commands

```bash
# API  (http://localhost:3000, health at /health)
npm install                 # in trail-running-api_v3/trail-running-api
npm run dev                 # nodemon; refuses to start without MongoDB (exits 1)
npm start                   # node src/app.js
npm run seed                # node src/seed.js  (destructive-ish; adds sample routes)
docker compose up -d        # mongo:8 on 27017, named volume mongodb_data

# Frontend  (http://localhost:4200)
npm install                 # in trail_running_frontend_v3
npm start                   # ng serve
npm run build               # -> dist/trail_running_frontend_v3 (production config by default)
```

No lint, no formatter, no typecheck script, no CI in either project. `tsconfig.json` is strict
(`strict`, `noPropertyAccessFromIndexSignature`, `strictTemplates`), so `ng build` is the typecheck.
Verification for the frontend = a clean `ng build` (no specs exist yet, by agreement).

## Verified gotchas

- **`CORS_ORIGIN` in `trail-running-api_v3/trail-running-api/.env` already includes the frontend**
  (`http://localhost:3000,http://localhost:4200`, added 2026-10-07). If it gets reset to only
  `http://localhost:3000`, browser calls from 4200 are blocked — re-add 4200 comma-separated. If
  the var is absent entirely, `app.js` falls back to `origin: true` (allow all).
- **`npm test` in the API fails** ("No tests found", exit 1). jest + supertest are installed but
  there is no `tests/` dir and no jest config in this copy. Don't treat that as a regression.
- **Angular 18 needs an explicit `standalone: true` in every `@Component`.** Angular 19+ (and the
  v20 reference model) make it the default, so copying a decorator from the model without it fails
  with `TS-992010: 'imports' is only valid on a component that is standalone`.
- **Tailwind is v3.4, not v4.** `@angular-devkit/build-angular@18` peer-requires
  `tailwindcss "^2 || ^3"`, so npm rejects Tailwind 4. The setup is `tailwind.config.js` (content
  `./src/**/*.{html,ts}`, brand `#FF385C`/`#E31C5F`) + `@tailwind` directives in `src/styles.css`.
  Do **not** "modernise" it to `@import "tailwindcss"`.
- **`tsconfig.json` needs `"rootDir": "./src"`.** A raw `tsc` from TS ≥6 (`npx tsc` pulls 7.x)
  fails to emit with `TS5011: common source directory ... must be explicitly set` without it.
  `ng build` (project pins TS 5.5.4) never triggers this; note `tsc -p tsconfig.spec.json` also
  errors `TS18003` (no `*.spec.ts` files exist, by agreement).
- Zod schemas are `.strict()`: any unknown query param or body key returns 400 `VALIDATION_ERROR`.
  Add new filters to `src/validators/trailRoute.validator.js`, not ad hoc in the controller.
- `z.coerce.boolean()` treats the string `"false"` as `true` (verified). The frontend therefore
  never sends `?isPublished=false`: the "Publicación" filter is applied **client-side** in
  `route-list`.
- Validation runs twice on purpose: `validate.middleware.js` then again in
  `trailRoute.service.js`. Both must be updated for a new field.
- **Rows seeded before the v2 schema lack `status`/`isActive`/`deleted_at` entirely** (and use
  `createdAt`/`updatedAt` instead of `created_At`/`updated_at`). Mongoose fills defaults *on read*,
  so the docs look fine but `find({ status: ... })` returns 0 rows. Symptom: `GET /routes` shows 0
  while `?status=all` shows N. Fix with a one-off `updateMany` migration (done 2026-10-06 for the
  2 seed rows); re-running `npm run seed` also works (it `deleteMany`s first).

## API architecture

Request flow is fixed: `routes/` (paths + order) → `controllers/` (thin, always `{ data }`) →
`services/` (business rules, `AppError`) → `repositories/` (all Mongoose queries) → `models/`.

- Controllers must stay one-liners; no Mongoose outside `repositories/`.
- Errors: throw `AppError(msg, status, code, details)` from `src/utils/appError.js`; service methods
  wrap their body in `try/catch` + `throw normalizeAppError(error)`. Success is `{ data }`,
  failure is `{ error: { code, message, details? } }` — the frontend reads that exact shape.
- `express-async-errors` is imported in `app.js`; async controller throws reach
  `error.middleware.js` without try/catch.
- Soft delete is the only delete: `DELETE /api/v1/routes/:id` and `PATCH /:id/soft-delete` flip an
  **active** route to `isActive:false, status:'inactive'` (they leave `deleted_at` alone); deleting an
  already-inactive route throws 409 `ROUTE_ALREADY_INACTIVE`. `PATCH /:id/restore` is the inverse —
  only inactive routes, 409 `ROUTE_ALREADY_ACTIVE` if already active; `activate`/`deactivate` share
  the same preconditions. Repository mutations are conditional updates, so the service does a second
  `findById(includeDeleted)` on `null` to tell 404 from 409.
- `GET /list` (and the repository `findAll`) return active **and** inactive routes by default
  (`status: { $in: ['active','inactive'] }`); `?status=active|inactive|deleted|all` narrows it
  (`all` = no status filter, `deleted` = legacy rows with `includeDeleted: true`).
  Repository queries still AND `deleted_at: null` unless `includeDeleted` is passed — only legacy
  rows ever have `deleted_at` set now.
- Model timestamps are aliased to `created_At` / `updated_at` (note the capital A in `created_At`,
  it's not a typo). `versionKey: false`. `2dsphere` index on `startPoint` is what makes `$near` work.
- `isPublished` drives the separate Publicada/Borrador UI badge; `status`/`isActive` drive
  Activo/Inactivo. Both exist on purpose.
- Routing order matters: `/nearby` and `/slug/:slug` are declared before `/:id`; the PATCH verb
  paths (`/activate`, `/deactivate`, `/soft-delete`, `/restore`) sit together after `/:id`.
- `slugify` lives in `src/utils/appError.js` (shared with `AppError`) — not in the service.

## Frontend architecture (v3)

Flow: page → `TrailRoutesStore` (signals, `core/stores`) → `TrailRouteService` (only file that
knows the API URL) → `ApiService` (generic HTTP + 10s timeout) → HttpClient. Components never
inject a service; pages orchestrate (service → store) and child components use inputs/outputs.

- Files carry **no `.component`/`.service` suffix** (`route-list.ts`, class `RouteList`), following
  the reference model at `C:\2_DAW\Programacio\Yomogan\Projecte1_Experiences\...\1_CRUD\frontend`.
- Every component is standalone (`standalone: true` explicitly — see gotchas) +
  `ChangeDetectionStrategy.OnPush`, with an **inline `template`** and signal `input()`/`output()`.
  No `.html`/`.css` per component; styling = Tailwind utilities in templates plus shared
  `.form-*`/`.button-*`/`.badge*`/`.status-*` helpers in `src/styles.css`.
- Router: `app.routes.ts` puts `MainLayout` around a lazy `loadChildren`
  `./features/routes/routes.routes`; paths use the **`_id`**, not the slug:
  `''` (list), `create`, `:id/edit`, `:id` (declared in that order).
- Interceptors: `loading.interceptor` toggles `LoadingService` (global `app-loader` overlay);
  `error.interceptor` maps API failures (`{ error: { code, message } }`) to a Spanish SweetAlert2
  toast and reads `error.error.error.message`. On 400 it also appends Zod's
  `details` (`[{ path, message }]`, max 8 lines) after a blank line. Success shape is `{ data }`.
- Error handling in pages is `async` + `firstValueFrom(...)` + literal `try/catch` (no
  `subscribe({ next, error })` anywhere except the intentional `paramMap.subscribe`). HTTP errors
  are left to the interceptor/state (catch block only falls through); non-HTTP errors (invalid
  body, timeout) call `showUnexpectedError(err)` from `shared/utils/error.util.ts` (also exports
  `isHttpError`). `TrailRouteService` validates every response with `extractData` (throws
  `INVALID_RESPONSE` when `data` is missing/malformed) so a wrong payload never renders silently.
- `route-form` is shared by create and edit pages: the `route` input is observed with `effect()`
  and patches the form once data arrives. It keeps CSV strings for `surface`/`tags` (converted in
  `submit()`) and uses `fb.nonNullable.group` so `getRawValue()` has no `| null` (Angular 18 typed
  forms).
- Name collision is intentional: model interface `RouteFilters` vs component class `RouteFilters`;
  `route-list.ts` imports the component aliased as `RouteFiltersComponent`.
- Store: `routes/loading/error/selectedRoute/loaded/stale` signals + `markStale()` and an
  `effect()` that keeps `selectedRoute` in sync with `routes` after every list refresh. After
  delete/restore the page calls `markStale()` then `load()` (the refetch is deliberate);
  `remove()` keeps the row in `_routes` as inactive (mirrors the API soft delete) and `restore()`
  is its inverse. Detail and edit pages **skip the `GET`** when `selectedRoute()?._id` matches the
  URL and the store is not `stale` (cache hit = no duplicated request); they subscribe to
  `paramMap` instead of reading `snapshot` in `ngOnInit` so `:id` changes re-load in place.
  `route-card` does not inject the store — it emits `edit`/`remove`/`restore` to the parent page.
- Validaciones viven en `shared/utils/validators.ts`: `urlValidator` (optional field, but must be
  http(s) when filled — `type="url"` does **not** validate on submit) applied to `imageUrl`/
  `gpxUrl`, and `OBJECT_ID_PATTERN` (`^[0-9a-fA-F]{24}$`) as the `pattern`/`required` rules of
  the search-by-id Reactive Form in `route-list`. `errorFor()` in `route-form` handles
  `invalidUrl`.
- Form a11y: every message has `role="alert"` + `id`, and every control gets conditional
  `[attr.aria-invalid]` + `[attr.aria-describedby]`.
- Navbar responsive: links visible at ≥sm; below that a hamburger button with a local signal,
  `aria-expanded`/`aria-controls="mobile-menu"`, closes on navigation. No extra libraries.
- `environment.ts` is production; `environment.development.ts` is swapped in through
  `fileReplacements` on the development config (both currently point to
  `http://localhost:3000/api/v1`). The key is **`API_URL`** (uppercase, renamed 2026-10-07;
  `environment.apiUrl` no longer exists) and `requestTimeout` is `10000`.
- `sweetalert2` is CommonJS and is listed in `allowedCommonJsDependencies` in `angular.json`
  (keep it there or every build warns).

## Conventions

- UI copy, labels and error messages are Spanish; code identifiers, types and API error `code`s are
  English. `README.md` in each project is the reference doc for its side (the frontend one was
  rewritten in Spanish 2026-10-07; it documents the data flow, `API_URL` table and the no-test
  verification rule), and `trail-running-api_v3/trail-running-api/postman.md` is the canonical
  endpoint-by-endpoint check.
- `postman.md` documents `INVALID_GEO_QUERY` for bad `/nearby` coords; the current validator returns
  `VALIDATION_ERROR` instead. Treat `postman.md` as intent, not as current behaviour.
- `src/seed.js` contains accented Spanish strings — keep files UTF-8 when editing.
