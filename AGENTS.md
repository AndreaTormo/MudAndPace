# AGENTS.md — MudAndPace v4

Monorepo del proyecto de trail running. Cuatro aplicaciones npm independientes y un `package.json` raíz que orquesta el arranque con `concurrently`. Ejecuta cada comando desde su carpeta.

```text
api_gateway/       Gateway Express (CommonJS, JS) — puerto 4000
backend/           API Express + Mongoose (CommonJS, JS) — puerto 3000
backend_agent_ia/  Asistente Groq + clima Open-Meteo (CommonJS, JS) — puerto 3001
frontend/          App Angular 18 (TypeScript, standalone) — puerto 4200
```

## Comandos

```bash
# Raíz: levanta gateway + API + IA + frontend
npm start                        # concurrently (requiere npm install en las cuatro carpetas)

# Gateway  (http://localhost:4000, health agregado en /health)
npm install                      # en api_gateway/
npm run dev                      # nodemon
npm start                        # node app.js

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

La IA es un servidor independiente. El frontend solo habla con el gateway: `AI_API_URL` y `API_URL` apuntan a `http://localhost:4000/api/v1`. El gateway enruta `/api/v1/agent/**` al puerto 3001 y el resto de `/api/v1/**` y `/uploads/**` al puerto 3000. Ambos backends confían en `X-Forwarded-For` (`trust proxy = 1`) para mantener los rate limits por IP real.

La IA también genera el resumen de comentarios y el análisis de sentimiento. Los comentarios CRUD siguen en el backend principal (`/api/v1/departures/:departureId/comments`), pero todo lo que llama a Groq vive en `backend_agent_ia/`: `GET /api/v1/agent/comments/:departureId/summary` (público) y `GET /api/v1/agent/comments/sentiment` (solo ADMIN, validado dentro de IA con `JWT_SECRET`, sesiones y rol). La IA lee comentarios y valoraciones de la misma MongoDB y persiste resultados en `ai_comment_summaries` y `ai_sentiment_analyses`; usa fingerprint versionado (`sentiment:v2`) para recalcular solo cuando cambian los datos. El informe separa sentimiento de comentarios y de opiniones de valoraciones, añade media/distribución de notas y rankings por modalidad (`variants`). El frontend muestra el resumen en `app-comment-section` (bajo `app-rating-panel`) y el dashboard en `/admin/analytics`. `backend_agent_ia` tiene `npm test` con Jest.

`backend/` tiene `npm test` con Jest para servicios de comentarios y valoraciones. `backend_agent_ia/` tiene `npm test` con Jest para el resumen y el sentimiento. El frontend se verifica con `npm run build`.

## Base de datos y seed

El seed vive en `backend/src/config/database.js` (`seedDatabase()`) y se ejecuta con `npm run seed`.

```bash
cd backend
npm run seed
```

- Es destructivo para hosts, categorías, ubicaciones, eventos, salidas, experiencias, imágenes, comentarios, valoraciones y cachés IA (`ai_comment_summaries`, `ai_sentiment_analyses`): ejecuta `deleteMany` y vuelve a insertar los datos de ejemplo.
- No borra usuarios ni perfiles. Los usuarios demo se actualizan por email con `upsert`.
- Deja 2 hosts, 2 categorías, 13 ubicaciones, 14 eventos, 42 salidas, 1 experiencia, 70 imágenes de evento, 1 imagen de experiencia, 15 comentarios y 10 valoraciones (una eliminada).
- Todos los eventos del seed incluyen al menos 3 modalidades en `variants`. `UTMB Mont-Blanc 2027` usa `OCC`, `CCC` y `UTMB`; `Val d'Aran by UTMB 2027` usa `20K`, `50K` y `100K`; el resto usa distancias adaptadas a su tipo de carrera.
- `UTMB Mont-Blanc 2026` es un duplicado finalizado de `UTMB Mont-Blanc 2027`: mismas modalidades (`OCC`, `CCC`, `UTMB`) y mismas fotos de Chamonix, con fechas en agosto de 2026. Sus 3 salidas ya han terminado, así que permite publicar comentarios.
- El seed inserta 15 comentarios y 10 valoraciones en las 3 salidas de `UTMB Mont-Blanc 2026`, con autores demo (`user@mudandpace.com`, `admin@mudandpace.com`, `admin2@mudandpace.com`). Los comentarios tienen `status: 'visible'`; una valoración está borrada lógicamente para probar `includeDeleted`.
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
| POST | `/user/login` | Público (USER) |
| POST | `/refresh` | Público |
| POST | `/logout` | Autenticado |
| GET | `/me` | Autenticado |

Rate limiting: 30 peticiones/15 min por IP en auth; 10/15 min en login. Superarlo devuelve 429 `TOO_MANY_REQUESTS`. Login USER usa `user_access_token`/`user_refresh_token`; ADMIN conserva `mp_access_token`. Login, refresh y logout limpian las cookies legacy `access_token` y `session_id` en `/api/v1` y `/`.

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

Endpoints de comentarios (requieren autenticación):

| Método | Endpoint | Acceso |
|---|---|---|
| GET/POST | `/api/v1/departures/:departureId/comments` | Cualquier usuario autenticado |
| POST | `/api/v1/comments/:id/report` | Cualquier usuario autenticado (excepto el autor) |
| GET | `/api/v1/comments` | Solo `ADMIN` |
| GET | `/api/v1/comments/deleted` | Solo `ADMIN` |
| PATCH | `/api/v1/comments/:id` | Solo el autor |
| DELETE | `/api/v1/comments/:id` | Autor o `ADMIN` (borrado lógico) |
| PATCH | `/api/v1/comments/:id/status`, `/:id/restore` | Solo `ADMIN` |

- Los comentarios pertenecen a una salida (`Departure`), no al evento. Solo se pueden publicar cuando `endDatetime` ya pasó; antes devuelve 409 `DEPARTURE_NOT_COMPLETED`.
- La salida debe estar activa/no cancelada y el evento publicado/activo; si no, devuelve 409 `DEPARTURE_NOT_COMMENTABLE` o `EVENT_NOT_COMMENTABLE`.
- `content` admite 3–1500 caracteres tanto en el validador como en el modelo. Se rechazan etiquetas HTML, entidades `<`/`>` y esquemas `javascript:`, `data:` o `vbscript:`. El saneado posterior colapsa espacios y recorta; las URLs se muestran como texto plano, sin linkificar. El cuerpo de escrituras de comentarios está limitado a 8 KB.
- `status` es `visible`, `reported` u `hidden`. El listado público incluye `visible` y `reported`, pero nunca `hidden` salvo para `ADMIN`.
- `POST /comments/:id/report` exige cuerpo vacío (`{}`), impide auto-reportar y registra cada usuario en `reportedBy`. Con 3 reportes distintos el comentario pasa a `hidden` automáticamente.
- Rate limit de 5 publicaciones por minuto por usuario en `POST` (no por IP) y de 10 reportes por minuto por usuario. Además hay cooldown de 7 segundos entre comentarios del mismo usuario y rechazo de duplicados del mismo usuario en 10 minutos mediante `contentHash`. No hay CAPTCHA.
- Las respuestas de comentarios exponen `reportCount`, nombre/initial y avatar del autor, nunca email ni teléfono. El nombre completo solo se serializa para `ADMIN`.
- La paginación usa `page`/`pageSize` (por defecto 20; la UI pide 5).
- `GET /shop/experiences/:slug` devuelve también salidas finalizadas para poder comentarlas. Al eliminar definitivamente una salida se borran sus comentarios.
- El frontend monta `app-comment-section` en el detalle de tienda junto a la salida seleccionada; `canComment` se calcula comparando `endDatetime` con `Date.now()`.
- `GET /api/v1/comments` lista visibles, reportados y ocultos (nunca borrados) con paginación `page`/`pageSize` y filtro opcional `status`. Añade `event`, `departureSlug` y `variant`; la modalidad se deriva del slug de la salida (`<event.slug>-<slugify(variant)>-<fecha>`) o, si no, del precio cuando solo coincide una modalidad.
- `/admin/comments` muestra filtros Todos/Visibles/Reportados/Ocultos/Papelera, permite alternar `status` con `PATCH /comments/:id/status`, eliminar con `DELETE /comments/:id` y restaurar con `PATCH /comments/:id/restore`.

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
- `app.config.ts` registra `withInterceptors([loadingInterceptor, errorInterceptor, authInterceptor])`.
- `auth.interceptor.ts` no gestiona tokens: las cookies `httpOnly` las envía el navegador. En un 401: en credenciales, logout o refresh no reintenta; en el resto llama una sola vez a `AuthStore.refreshSession()`, vuelve a enviar la petición con un flag anti-bucles y, si falla, limpia y redirige a `/auth/login` con `returnUrl`.
- `error.interceptor.ts` muestra mensajes en español, incluidos 401/403, red (status 0), timeout, respuestas inválidas y el desglose `details` de Zod; `/auth/refresh` es silencioso.
- `AuthStore` persiste únicamente `expiresAt` y `username` en `localStorage` (`mudandpace.session`); el usuario completo y `canManage` se hidratan en memoria desde `GET /auth/me` al arrancar (`MainLayout`). Programa un timer de expiración que marca `sessionExpired` (el effect de `MainLayout` redirige con `returnUrl`). Expone `user`, `username`, `canManage`, `isAdmin` e `isAuthenticated()`. `isAuthenticated` solo comprueba `expiresAt` con `Date.now()`, porque las cookies no son legibles desde JS.

### Rutas y guards

- `/auth` → `AuthLayout` con login y registro.
- `/` → `MainLayout` protegido por `authGuard`; redirige a `/shop`.
- `/profile` → perfil del usuario autenticado.
- `/admin/profiles` → listado de perfiles para `ADMIN`, protegido por `adminGuard` (espera a `refreshMe()` si aún no hay usuario en memoria).
- `/admin/comments` → listado y moderación de comentarios para `ADMIN`, protegido por `adminGuard`.
- `/events` → lista; `/events/:id` → detalle; `/events/create`, `/events/:id/edit` y `/events/trash` protegidos por `adminGuard`.
- `guestGuard` evita que un usuario autenticado vuelva a login/registro/olvido.

### UI por rol

- `navbar` y `sidebar` leen `AuthStore`; solo muestran perfiles de usuarios, comentarios, crear evento, papelera y sección de administración a `ADMIN`.
- En `/shop` la navbar se superpone al hero, la sidebar se oculta y el landing usa su propia paleta clara/oscura según el tema; el logo y la raíz enlazan a `/shop`, pero el enlace “Shop” abre `/shop/experiences`.
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

`GET /events` usa paginación explícita (`page`/`pageSize` + `pagination.total`) con `pageSize` máximo 100. La vista `/events` pide `pageSize=100` y reutiliza `app-pagination` con paginación de cliente de 10 en la vista lista; la vista calendario sigue usando la lista completa cargada. El resto de listados (referencias, usuarios y perfiles) se devuelven completos. No introducir límites fijos (`limit`, `slice`, etc.) que oculten elementos silenciosamente. `/admin/profiles` reutiliza el mismo `app-pagination` con paginación de cliente sobre la respuesta completa de `GET /profile`; el paginador muestra el rango y el total, por lo que el recorte no es silencioso. Si el volumen crece, migrar esos listados a paginación de servidor.

## Convenios

- UI en español; identificadores, tipos y códigos de error en inglés.
- Ficheros UTF-8 con acentos.
