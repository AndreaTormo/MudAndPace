# AGENTS.md — MudAndPace v4

Monorepo del proyecto de trail running. Dos aplicaciones npm independientes (sin `package.json` raíz ni workspace). Ejecuta cada comando desde su carpeta.

```text
backend/   API Express + Mongoose (CommonJS, JS)
frontend/  App Angular 18 (TypeScript, standalone)
```

## Comandos

```bash
# API  (http://localhost:3000, health en /health)
npm install                      # en backend/
npm run dev                      # nodemon
npm start                        # node src/app.js
npm run seed                     # node src/seed.js (datos de ejemplo + usuarios demo)
docker compose up -d             # mongo:8 en 27017, volumen mongodb_data

# Frontend  (http://localhost:4200)
npm install                      # en frontend/
npm start                        # ng serve
npm run build                    # typecheck + build de producción
```

No hay tests automatizados en el repositorio. La verificación del frontend es `npm run build` sin errores; las pruebas del backend se hacen manualmente contra la API.

## Base de datos y seed

El seed vive en `backend/src/config/database.js` (`seedDatabase()`) y se ejecuta con `npm run seed`.

```bash
cd backend
npm run seed
```

- Es destructivo para hosts, categorías, ubicaciones, eventos, experiencias e imágenes: ejecuta `deleteMany` y vuelve a insertar los datos de ejemplo.
- No borra usuarios ni perfiles. Los usuarios demo se actualizan por email con `upsert`.
- Deja 1 host, 2 categorías, 12 ubicaciones, 12 eventos, 1 experiencia y 1 imagen de experiencia.
- Los eventos requieren `sku` único; ya está incluido en el seed. Si se añade un evento al seed sin `sku`, Mongoose falla con `Event validation failed: sku: Path \`sku\` is required.`
- Credenciales demo (verificadas y activas):
  - `admin@mudandpace.com` / `Admin123!` (`ADMIN`)
  - `admin2@mudandpace.com` / `Admin123!` (`ADMIN`)
  - `user@mudandpace.com` / `User123!` (`USER`)
- Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.
- Si el frontend muestra menos eventos de los esperados, comprueba `db.events.countDocuments({})` en MongoDB.

Variables relevantes en `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/trail_running
JWT_SECRET=change-me-with-a-long-random-secret
JWT_EXPIRES_IN=1h
APP_URL=http://localhost:4200
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

`JWT_SECRET` es obligatorio: `app.js` no arranca sin él.

## Arquitectura de la API

Flujo fijo: `routes/ → controllers/ → services/ → repositories/ → models/`.

- Los controladores son finos y devuelven `{ success, message, data }`.
- Errores: `AppError(msg, status, code, details)` desde `src/utils/appError.js`. Respuesta `{ error: { code, message, details? } }`.
- `express-async-errors` está importado en `app.js`.
- Validación doble: `validate.middleware.js` (body/params/query) y de nuevo en el servicio. Ambos deben actualizarse para un campo nuevo.
- Los esquemas Zod son `.strict()`: cualquier clave desconocida devuelve 400 `VALIDATION_ERROR`.
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
- No existe `GET /auth/me`: el frontend guarda el `_id` devuelto por login y usa `GET /profile/me` y `GET /users/:id`.

Endpoints de auth (`/api/v1/auth`):

| Método | Endpoint | Acceso |
|---|---|---|
| POST | `/login` | Público |
| POST | `/logout` | Autenticado |

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
| GET | `/me` | Autenticado |
| PATCH | `/me` | Autenticado |
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

Referencias (`/api/v1/references/categories`, `/locations`, `/hosts`) requieren autenticación.

### Papelera (borrado lógico)

- `softDeleteById` fija `deleted_at: new Date()`, `isActive: false`, `status: 'deleted'`.
- `restoreById` busca `{ _id, deleted_at: { $ne: null } }` y limpia `deleted_at`.
- `findAllDeleted` devuelve `{ deleted_at: { $ne: null } }` ordenado por `deleted_at` descendente.
- `hardDeleteById` hace `findOneAndDelete({ _id, deleted_at: { $ne: null } })` (solo desde la papelera).
- `GET /deleted` lista la papelera. `DELETE /:id/permanent` elimina definitivamente.
- Restaurar algo que no está en la papelera devuelve 409 `EVENT_ALREADY_ACTIVE`.
- Eliminar definitivamente algo no borrado devuelve 409 `EVENT_NOT_DELETED`.

### Convenciones de la API

- `slug` único e indexado. Operaciones internas por ID, no por slug.
- Timestamps: `created_At` / `updated_at` (con mayúscula en `created_At`, no es un error). `versionKey: false`.
- Índice `2dsphere` en `coordinates` de `Location` (mapa de ubicación).
- `status: published/draft` (eventos) es un dominio separado del borrado.
- `sku` de eventos es obligatorio y único.

## Arquitectura del frontend

Página → Store (signals) → Service (único que conoce la URL) → `ApiService` → `HttpClient`. Los componentes nunca inyectan el servicio directamente.

- Componentes standalone + `ChangeDetectionStrategy.OnPush` + plantilla inline (sin `.html` por componente). Estilos en `src/styles.css`.
- Estado con Angular signals (sin NgRx), expuestos vía `.asReadonly()`.
- Rutas lazy con `loadComponent`.
- `app.config.ts` registra `withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])`.
- `auth.interceptor.ts` añade el Bearer desde `AuthStore` y redirige a login en 401 fuera de `/auth`.
- `error.interceptor.ts` muestra mensajes en español, incluidos 401/403 y el desglose `details` de Zod.
- `AuthStore` persiste la sesión en `localStorage` (`mudandpace.auth`) y expone `user`, `role`, `isAdmin` y `isAuthenticated()`. `isAuthenticated` es un método porque comprueba la expiración con `Date.now()`.

### Rutas y guards

- `/auth` → `AuthLayout` con login y registro.
- `/` → `MainLayout` protegido por `authGuard`; redirige a `/events`.
- `/profile` → perfil del usuario autenticado.
- `/events` → lista; `/events/:id` → detalle; `/events/create`, `/events/:id/edit` y `/events/trash` protegidos por `adminGuard`.
- `guestGuard` evita que un usuario autenticado vuelva a login/registro/olvido.

### UI por rol

- `navbar` y `sidebar` leen `AuthStore`; solo muestran crear evento, papelera y sección de administración a `ADMIN`.
- `event-row` recibe `canManage`; las acciones de administración no se renderizan para `USER`.
- `event-list` y `event-detail` ocultan crear/editar/eliminar/activar para `USER`.
- La autorización real siempre está en la API; el ocultado de UI es solo experiencia de usuario.

### Eventos

- Módulo único de contenido. El antiguo módulo `trailRoute` (rutas) se eliminó y sus campos propios (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- `buildUniqueSlug(name, excludeId)` en `event.service.js` deriva el slug del nombre con `utils/slugify.js` y resuelve colisiones con sufijos `-2`, `-3`… En `update` se ignora el propio evento.
- Reglas de negocio numéricas: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`.
- Edición desde el dashboard (`/events/:id/edit`): el formulario solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm` y `elevationGain`. El resto de campos se conservan (actualización parcial).
- `slugify` vive en `src/utils/slugify.js`; `utils/appError.js` lo reexporta por compatibilidad.
- No se implementa módulo `Experience` ni reservas.

### Perfil, roles y sesiones

- `profile.service.js` recibe `userId` (nunca `req`); el controller lo obtiene de `req.user.id`.
- `/profile/me` (GET/PATCH) opera sobre el usuario autenticado; `/profile/:userId` exige self o `ADMIN`.
- Campos del perfil: `firstName`, `lastName`, `phone`, `avatarUrl`, `city`, `country`, `birthDate`. El avatar es una URL opcional; si falta, la UI muestra la inicial del nombre.
- `User.role` es un enum simple (`USER`/`ADMIN`); no existe colección ni módulo `Role`.
- El login crea un documento en `sessions` con `jti`, `tokenHash` (SHA-256), `expiresAt`, `ip` y `userAgent`; el logout lo revoca y `authenticate` exige sesión activa.
- El registro (`POST /users/register`) crea usuario + perfil. `auth.service.js` solo contiene `login` y `logout`.
- Un usuario con soft-delete conserva su perfil (también soft-delete) y sus sesiones se revocan.

### Listados sin límite

No introducir límites fijos (`limit`, `slice`, etc.) en los listados. Si se añade paginación en el futuro, debe ser explícita (`page`/`pageSize` + total) y no ocultar elementos silenciosamente.

## Convenios

- UI en español; identificadores, tipos y códigos de error en inglés.
- Ficheros UTF-8 con acentos.
