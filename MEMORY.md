# MEMORY.md — MudAndPace v4

Memoria del proyecto entre sesiones. Breve y actualizada.

## Estado actual
- v4 con backend (Express + Mongoose, puerto 3000), servidor de IA (`backend_agent_ia`, puerto 3001) y frontend (Angular 18) funcionales.
- `backend_agent_ia` es una app npm independiente con su propio `package.json`, `app.js` y `.env`; expone `/api/v1/agent/chat` y `/api/v1/agent/weather` en el 3001. El backend principal ya no monta la IA.
- Autenticación JWT: registro (`POST /users/register`), login y logout con revocación de sesión. No hay verificación de email ni reset de contraseña.
- RBAC (`USER`/`ADMIN`) con `User.role` como campo simple; perfiles self-or-admin. Frontend con `AuthStore` (caché híbrido en localStorage + refresh `/me`), guards (`auth`, `guest`, `admin` en fichero propio) e interceptores.
- Módulo único de contenido: `events`. El módulo `trailRoute` (rutas) se eliminó.
- Eventos: lectura para cualquier usuario autenticado; creación, edición, publicación y papelera solo para `ADMIN`.
- Eventos con al menos 3 modalidades embebidas (`variants`): nombre, distancia, desnivel y precio; se gestionan en el formulario y se muestran en el detalle.
- Perfil de usuario editable en `/profile`; navbar/sidebar ocultan administración a `USER`.
- Papelera de eventos implementada (restaurar + eliminar definitivamente).
- Mapa de ubicación en el detalle de eventos mediante iframe de OpenStreetMap (sin Leaflet).
- Listados con query params dinámicos e índices MongoDB; `GET /events` pagina con `page`/`pageSize` y mantiene `data` como array más `pagination`.

## Decisiones
- Todo `/api/v1/**` requiere autenticación salvo `POST /api/v1/auth/login` y `POST /api/v1/users/register`; `/health` y `/uploads` son públicos.
- JWT HS256 con `sub`, `role`, `ver` (`tokenVersion`) y `jti`, sin refresh token. Cada login guarda una sesión con hash SHA-256 del token; el logout la revoca y el token deja de valer.
- Passwords con `bcryptjs` 12 rondas; 8–72 caracteres con mayúscula, minúscula y número.
- El perfil se consulta/edita en `GET/PATCH /api/v1/profile/me`; el avatar admite URL externa o subida con `POST /profile/me/avatar` (JPG/PNG/WebP, 5 MB) y tiene fallback a la inicial. El navbar y el perfil se actualizan al instante desde `AuthStore`. `GET /auth/me` (autenticado) devuelve el usuario del token y lo usa el frontend para refrescar la sesión.
- Errores de auth/permisos en inglés; el frontend los traduce al español.
- Módulo único de contenido: `events`. Los campos de `trailRoute` (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- La edición desde el dashboard (`/events/:id/edit`) solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm`, `elevationGain` y `variants`; el resto se conserva por actualización parcial.
- Mapa sin dependencias externas: iframe embebido de OpenStreetMap en `event-map.ts`. Leaflet eliminado.
- Borrado lógico = `deleted_at` con fecha. `restoreById` filtra por `deleted_at != null`.
- Eliminar definitivo solo desde la papelera. Todo se opera por ID, no por slug.
- `slug` de eventos generado desde el nombre con `buildUniqueSlug` (sufijos `-2`, `-3`…); en `update` se ignora el propio evento.
- Reglas numéricas de eventos: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`, también en cada elemento de `variants`. Cada evento debe tener al menos 3 modalidades, también al actualizar sin enviar `variants`.
- `variants` es un array embebido en `Event` (sin colección ni endpoints propios), obligatorio y con mínimo 3 elementos. Los filtros de distancia consideran la distancia principal y las modalidades.
- `sku` de eventos obligatorio y único; el seed incluye un `sku` por evento.
- Seed en `config/database.js` (`seedDatabase()`), ejecutado con `npm run seed`. Es destructivo para contenido (hosts, categorías, ubicaciones, eventos, experiencias e imágenes), pero no borra usuarios/perfiles.
- Filtros de eventos por `categorySlug`, `hostSlug` y `locationSlug` (con alias `*_slug`), además de estado, dificultad, superficie, tags, distancia, desnivel, precio, fechas y búsqueda. Params vacíos ignorados y desconocidos rechazados con 400.
- `GET /events` pagina explícitamente (`page`, `pageSize` máximo 100) y añade `pagination`; referencias, usuarios y perfiles siguen completos.
- Índices compuestos y de texto en modelos para home/listados; `connectDatabase()` ejecuta `ensureIndexes()`.
- `Location` incluye `country` opcional; el seed lo rellena para las 13 ubicaciones.
- La IA se separó en su propio servidor (3001) para que el backend quede solo en el 3000. El frontend usa `AI_API_URL` (`http://localhost:3001/api/v1`) para `agent/chat` y `agent/weather`; `ApiService` expone `getAi`/`postAi`.
- El dashboard `/events` tiene selector `Lista | Calendario` solo para `ADMIN`, con preferencia en `localStorage` (`mudandpace.events.view`). El calendario es mensual en escritorio y agenda en móvil, usa los eventos de `EventsStore` y enlaza al detalle.

## Verificación
- `npm run build` en `frontend/` pasa correctamente, incluida la gestión de modalidades de evento.
- Validación offline del modelo `Event`/Zod con `variants` (sin Mongo ni API levantada).
- Prueba manual de UI (Edge headless, 17/17): login USER, recarga con refresh `GET /auth/me`, expiración con returnUrl + limpieza de localStorage, logout + recarga sin sesión, USER redirigido de `/events/create` y `/events/trash`, ADMIN accediendo a ambas.
- Smoke test manual de la API superado: health, login, `/auth/me`, perfil, registro, logout con revocación y RBAC.
- Base de datos verificada: 3 usuarios, 3 perfiles; 1 host, 2 categorías, 13 ubicaciones, 13 eventos, 1 experiencia y 1 imagen de experiencia. Todos los eventos del seed tienen al menos 3 modalidades.
- `npm run seed` correcto tras añadir índices; consultas verificadas: filtros por slug, combinaciones, alias, paginación, búsqueda de texto, referencias y usuarios.

## Limitaciones conocidas
- Sin tests automatizados en frontend ni backend (verificación manual contra la API y la app).
- `npm audit` del backend sin vulnerabilidades (Zod 4.6.7 y body-parser 1.20.9).
- Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.

## Pendiente
- Revisión visual manual de las pantallas de auth y perfil en navegador.
