# AGENTS.md — MudAndPace v4

Monorepo del proyecto de trail running. Tres aplicaciones npm independientes (sin `package.json` raíz ni workspace). Ejecuta cada comando desde su carpeta.

```text
backend/           API Express + Mongoose (CommonJS, JS) — puerto 3000
backend_agent_ia/  Asistente Groq + clima Open-Meteo (CommonJS, JS) — puerto 3001
frontend/          App Angular 18 (TypeScript, standalone) — puerto 4200
```

## Comandos

```bash
# API  (http://localhost:3000, health en /health)
npm install                      # en backend/
npm run dev                      # nodemon
npm start                        # node src/app.js
npm run seed                     # node src/seed.js (datos de ejemplo + usuarios demo)
docker compose up -d             # mongo:8 en 27017, volumen mongodb_data

# IA  (http://localhost:3001, health en /health)
npm install                      # en backend_agent_ia/
npm run dev                      # nodemon
npm start                        # node app.js

# Frontend  (http://localhost:4200)
npm install                      # en frontend/
npm start                        # ng serve
npm run build                    # typecheck + build de producción
```

La IA es un servidor independiente. El frontend apunta a `AI_API_URL` (`http://localhost:3001/api/v1`); el resto de la API usa `API_URL` (`http://localhost:3000/api/v1`).

La verificación es manual contra la API y la app; no hay tests automatizados.

## Base de datos y seed

El seed vive en `backend/src/config/database.js` (`seedDatabase()`) y se ejecuta con `npm run seed`.

```bash
cd backend
npm run seed
```

- Es destructivo para hosts, categorías, ubicaciones, eventos, experiencias e imágenes: ejecuta `deleteMany` y vuelve a insertar los datos de ejemplo.
- No borra usuarios ni perfiles. Los usuarios demo se actualizan por email con `upsert`.
- Deja 1 host, 2 categorías, 13 ubicaciones, 13 eventos, 1 experiencia y 1 imagen de experiencia.
- Todos los eventos del seed incluyen al menos 3 modalidades en `variants`. `UTMB Mont-Blanc 2027` usa `OCC`, `CCC` y `UTMB`; `Val d'Aran by UTMB 2027` usa `20K`, `50K` y `100K`; el resto usa distancias adaptadas a su tipo de carrera.
- Los eventos requieren `sku` único; ya está incluido en el seed. Si se añade un evento al seed sin `sku`, Mongoose falla con `Event validation failed: sku: Path \`sku\` is required.`
- Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.
- Si el frontend muestra menos eventos de los esperados, comprueba `db.events.countDocuments({})` en MongoDB.

## Arquitectura de la API

Flujo fijo: `routes/ → controllers/ → services/ → repositories/ → models/`.

- Los controladores son finos y devuelven `{ success, message, data }`.
- Errores: `AppError(msg, status, code, details)` desde `src/utils/appError.js`. Respuesta `{ error: { code, message, details? } }`.
- `express-async-errors` está importado en `app.js`.
- Validación doble: `validate.middleware.js` (body/params/query) y de nuevo en el servicio. Ambos deben actualizarse para un campo nuevo.
- Los esquemas Zod son `.strict()`: cualquier clave desconocida devuelve 400 `VALIDATION_ERROR`.
- Los query params se validan con `validators/query.validator.js` y se convierten a filtros Mongo con `utils/queryBuilder.js`. Los valores vacíos se ignoran; los filtros se combinan con `$and`. Los servicios pueden reutilizar `utils/userQuery.js` para usuarios/perfiles.
- Los errores de auth y permisos usan mensajes en inglés; el frontend los traduce al español.

### Autenticación y autorización

- Público: `POST /api/v1/auth/login`, `POST /api/v1/users/register`, `GET /health` y `/uploads`.
- Todo lo demás bajo `/api/v1` requiere `Authorization: Bearer <token>`.
- JWT HS256 con `jsonwebtoken`, `JWT_SECRET`, `JWT_EXPIRES_IN` (1h por defecto). Sin refresh token.
- El token incluye `sub` (ID de usuario), `role`, `ver` (`tokenVersion`) y `jti`. Cada login crea una sesión en la colección `sessions` con el hash SHA-256 del token; `POST /auth/logout` la revoca y el token deja de ser válido.
- `authenticate.middleware.js` comprueba token, sesión activa por `jti` (no revocada y no expirada), usuario existente, `isActive`/`status` y `tokenVersion`.
- El rol es un campo simple en `User` (`role: 'USER' | 'ADMIN'`). Se valida en el login, se firma en el JWT y se vuelve a comprobar en `authenticate`.
- `authorize.middleware.js` centraliza la autorización: `authorize()` exige `ADMIN`; `authorize('id')` permite el propio usuario o `ADMIN`. El 404 de rutas desconocidas vive en `validate.middleware.js` (`validate.notFound`).
- Passwords con `bcryptjs`, 12 rondas. Reglas: 8–72 caracteres, mayúscula, minúscula y número.
- `GET /auth/me` (autenticado) devuelve el usuario del token para refrescar la sesión en el frontend; `GET /profile/me` sigue siendo el perfil editable.

Endpoints de auth (`/api/v1/auth`):

| Método | Endpoint | Acceso |
|---|---|---|
| POST | `/login` | Público |
| POST | `/logout` | Autenticado |
| GET | `/me` | Autenticado |

Rate limiting: 30 peticiones/15 min por IP en auth; 10/15 min en login. Superarlo devuelve 429 `TOO_MANY_REQUESTS`.

Endpoints de usuarios (`/api/v1/users`):

| Método | Endpoint | Acceso |
|---|---|---|
| POST | `/register` | Público |
| POST | `/` | Solo `ADMIN` |
| GET | `/` | Solo `ADMIN` |
| GET | `/:id` | El propio usuario o `ADMIN` |
| PATCH | `/:id` | El propio usuario o `ADMIN` (un `USER` no puede cambiar `role`, `status` ni `isActive`) |
| PATCH | `/:id/activation` | Solo `ADMIN` |
| DELETE | `/:id` | Solo `ADMIN` (soft-delete) |

Endpoints de perfil (`/api/v1/profile`, requieren autenticación):

| Método | Endpoint | Acceso |
|---|---|---|
| GET | `/` | Solo `ADMIN` (listado de usuarios con su perfil) |
| GET | `/me` | Autenticado |
| PATCH | `/me` | Autenticado |
| POST | `/me/avatar` | Autenticado (multipart, campo `avatar`; JPG/PNG/WebP, 5 MB) |
| GET | `/:userId` | El propio usuario o `ADMIN` |
| PATCH | `/:userId` | El propio usuario o `ADMIN` |

Endpoints de eventos (`/api/v1/events`, requieren autenticación):

| Método | Endpoint | Acceso |
|---|---|---|
| GET | `/` y `/slug/:slug` | Cualquier usuario autenticado |
| GET | `/:id` | Cualquier usuario autenticado |
| GET | `/:id/images` | Cualquier usuario autenticado |
| GET | `/deleted` | Solo `ADMIN` |
| POST/PUT | `/` y `/:id` | Solo `ADMIN` |
| PATCH | `/:id/publish`, `/unpublish`, `/soft-delete`, `/restore` | Solo `ADMIN` |
| DELETE | `/:id`, `/:id/permanent` | Solo `ADMIN` |
| POST/PATCH/DELETE | `/:id/images/*` | Solo `ADMIN` |

`GET /events` acepta filtros combinables por `categorySlug`, `hostSlug`, `locationSlug` (y alias `*_slug`), `status`, `isActive`, `difficulty`, `surface`, `tags`, `minDistance`, `maxDistance`, `minElevationGain`, `maxElevationGain`, `minPrice`, `maxPrice`, `fromDate`, `toDate` y `search`. La paginación es explícita con `page` y `pageSize` (máximo 100); la respuesta mantiene `data` como array y añade `pagination: { total, page, pageSize, totalPages }`.

Referencias (`/api/v1/references/categories`, `/locations`, `/hosts`) requieren autenticación. Aceptan `search`, `slug`, `status`, `isActive` e `is_active`; ubicaciones además `city` y `country`. Los listados de usuarios y perfiles aceptan `search`, `role`, `status`, `isActive` e `is_active`.

### Papelera (borrado lógico)

- `softDeleteById` fija `deleted_at: new Date()`, `isActive: false`, `status: 'deleted'`.
- `restoreById` busca `{ _id, deleted_at: { $ne: null } }` y limpia `deleted_at`.
- `findAllDeleted` devuelve `{ deleted_at: { $ne: null } }` ordenado por `deleted_at` descendente.
- `hardDeleteById` hace `findOneAndDelete({ _id, deleted_at: { $ne: null } })` (solo desde la papelera).
- `GET /deleted` lista la papelera. `DELETE /:id/permanent` elimina definitivamente.
- Restaurar algo que no está en la papelera devuelve 409 `EVENT_ALREADY_ACTIVE`.
- Eliminar definitivamente algo no borrado devuelve 409 `EVENT_NOT_DELETED`.

### Convenciones de la API

- `slug` único (índice único parcial con `deleted_at: null`) e indexado. Operaciones internas por ID, no por slug.
- Timestamps: `created_At` / `updated_at` (con mayúscula en `created_At`, no es un error). `versionKey: false`.
- Índice `2dsphere` en `coordinates` de `Location` (mapa de ubicación).
- `connectDatabase()` ejecuta `ensureIndexes()`; los índices compuestos cubren los filtros de home/listados y hay índices de texto para búsquedas de eventos, categorías, hosts y ubicaciones.
- `status: published/draft` (eventos) es un dominio separado del borrado.
- `sku` de eventos es obligatorio y único.
- `variants` es un array embebido en `Event`; cada modalidad tiene `name`, `distanceKm`, `elevationGain` y `price`. Es obligatorio y debe tener al menos 3 elementos. No hay colección ni endpoints propios.

## Arquitectura del frontend

Página → Store (signals) → Service (único que conoce la URL) → `ApiService` → `HttpClient`. Los componentes nunca inyectan el servicio directamente.

- Componentes standalone + `ChangeDetectionStrategy.OnPush` + plantilla inline (sin `.html` por componente). Estilos en `src/styles.css`.
- Estado con Angular signals (sin NgRx), expuestos vía `.asReadonly()`.
- Rutas lazy con `loadComponent`.
- `app.config.ts` registra `withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])`.
- `auth.interceptor.ts` añade el Bearer desde `AuthStore`. Antes de enviar aborta si el token ya caducó (clear + redirect sin popup). En un 401: en `auth/login` o `users/register` no hace nada (credenciales), en `auth/logout` solo limpia, y en el resto limpia y redirige a `/auth/login` con `returnUrl` (sin duplicar si ya está en `/auth`).
- `error.interceptor.ts` muestra mensajes en español, incluidos 401/403, red (status 0), timeout, respuestas inválidas y el desglose `details` de Zod. En un 401 muestra además el popup de credenciales (el redirect lo hace el interceptor de auth).
- `AuthStore` persiste token + usuario + `expiresAt` en `localStorage` (`mudandpace.auth`): la UI arranca rápido desde la caché y `MainLayout` refresca con `GET /auth/me`. Programa un timer de expiración que marca `sessionExpired` (el effect de `MainLayout` redirige con `returnUrl`). Expone `user`, `roles` (`[role]`), `isAdmin` e `isAuthenticated()`. `isAuthenticated` es un método porque comprueba la expiración con `Date.now()`.

### Rutas y guards

- `/auth` → `AuthLayout` con login y registro.
- `/` → `MainLayout` protegido por `authGuard`; redirige a `/shop`.
- `/profile` → perfil del usuario autenticado.
- `/admin/profiles` → listado de perfiles para `ADMIN`, protegido por `adminGuard`.
- `/events` → lista; `/events/:id` → detalle; `/events/create`, `/events/:id/edit` y `/events/trash` protegidos por `adminGuard`.
- `guestGuard` evita que un usuario autenticado vuelva a login/registro/olvido.

### UI por rol

- `navbar` y `sidebar` leen `AuthStore`; solo muestran perfiles de usuarios, crear evento, papelera y sección de administración a `ADMIN`.
- En `/shop` la navbar se superpone al hero, la sidebar se oculta y el landing usa su propia paleta clara/oscura según el tema; el logo y la raíz enlazan a `/shop`.
- `event-row` recibe `canManage`; las acciones de administración no se renderizan para `USER`.
- `event-list` y `event-detail` ocultan crear/editar/eliminar/activar para `USER`.
- El selector `Lista | Calendario` de `/events` solo se muestra a `ADMIN`; la preferencia se guarda en `localStorage` (`mudandpace.events.view`). El calendario es mensual en escritorio y agenda en móvil, y cada evento enlaza a `/events/:id`.
- La autorización real siempre está en la API; el ocultado de UI es solo experiencia de usuario.

### Eventos

- Módulo único de contenido. El antiguo módulo `trailRoute` (rutas) se eliminó y sus campos propios (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- `buildUniqueSlug(name, excludeId)` en `event.service.js` deriva el slug del nombre con `utils/slugify.js` y resuelve colisiones con sufijos `-2`, `-3`… En `update` se ignora el propio evento.
- Reglas de negocio numéricas: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`; se aplican también a cada elemento de `variants`. El evento debe tener al menos 3 modalidades, también al actualizar sin enviar `variants`.
- Las modalidades se gestionan dentro del formulario de evento y se muestran en el detalle; el listado resume sus nombres. Los filtros de distancia consideran tanto la distancia principal como las modalidades.
- La vista calendario usa los eventos ya cargados en `EventsStore` (sin endpoint nuevo). Los eventos de varios días aparecen en cada día que abarcan; `calendar.util.ts` calcula la rejilla mensual, los rangos y las etiquetas en fecha local.
- Edición desde el dashboard (`/events/:id/edit`): el formulario solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm`, `elevationGain` y `variants`. El resto de campos se conservan (actualización parcial).
- `slugify` vive en `src/utils/slugify.js`; `utils/appError.js` lo reexporta por compatibilidad.
- No se implementa módulo `Experience` ni reservas.

### Perfil, roles y sesiones

- `profile.service.js` recibe `userId` (nunca `req`); el controller lo obtiene de `req.user.id`.
- `GET /profile` es solo `ADMIN` y devuelve todos los usuarios no borrados con su perfil asociado (`profile: null` si no existe).
- `/profile/me` (GET/PATCH) opera sobre el usuario autenticado; `/profile/:userId` exige self o `ADMIN`.
- Campos del perfil: `firstName`, `lastName`, `phone`, `avatarUrl`, `city`, `country`, `birthDate`. El avatar admite una URL externa o una imagen subida con `POST /profile/me/avatar`, que se guarda en `/uploads/avatars/<userId>/`. Si falta o no carga, la UI muestra la inicial del nombre.
- El navbar y la cabecera de `/profile` leen `AuthStore.user`; al subir o cambiar el avatar se actualizan al instante, sin recargar la página.
- `User.role` es un enum simple (`USER`/`ADMIN`); no existe colección ni módulo `Role`.
- El login crea un documento en `sessions` con `jti`, `tokenHash` (SHA-256), `expiresAt`, `ip` y `userAgent`; el logout lo revoca y `authenticate` exige sesión activa.
- El registro (`POST /users/register`) crea usuario + perfil. `auth.service.js` contiene `login`, `logout` y `me`.
- Un usuario con soft-delete conserva su perfil (también soft-delete) y sus sesiones se revocan.

### Listados y paginación

`GET /events` usa paginación explícita (`page`/`pageSize` + `pagination.total`) con `pageSize` máximo 100. El resto de listados (referencias, usuarios y perfiles) se devuelven completos. No introducir límites fijos (`limit`, `slice`, etc.) que oculten elementos silenciosamente.

## Convenios

- UI en español; identificadores, tipos y códigos de error en inglés.
- Ficheros UTF-8 con acentos.
