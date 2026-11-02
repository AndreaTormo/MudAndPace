# MEMORY.md — MudAndPace v4

Memoria del proyecto entre sesiones. Breve y actualizada.

## Estado actual
- v4 con backend (Express + Mongoose) y frontend (Angular 18) funcionales.
- Autenticación JWT: registro (`POST /users/register`), login y logout con revocación de sesión. No hay verificación de email ni reset de contraseña.
- RBAC (`USER`/`ADMIN`) con `User.role` como campo simple; perfiles self-or-admin. Frontend con `AuthStore` (caché híbrido en localStorage + refresh `/me`), guards (`auth`, `guest`, `admin` en fichero propio) e interceptores.
- Módulo único de contenido: `events`. El módulo `trailRoute` (rutas) se eliminó.
- Eventos: lectura para cualquier usuario autenticado; creación, edición, publicación y papelera solo para `ADMIN`.
- Perfil de usuario editable en `/profile`; navbar/sidebar ocultan administración a `USER`.
- Papelera de eventos implementada (restaurar + eliminar definitivamente).
- Mapa de ubicación en el detalle de eventos mediante iframe de OpenStreetMap (sin Leaflet).

## Decisiones
- Todo `/api/v1/**` requiere autenticación salvo `POST /api/v1/auth/login` y `POST /api/v1/users/register`; `/health` y `/uploads` son públicos.
- JWT HS256 con `sub`, `role`, `ver` (`tokenVersion`) y `jti`, sin refresh token. Cada login guarda una sesión con hash SHA-256 del token; el logout la revoca y el token deja de valer.
- Passwords con `bcryptjs` 12 rondas; 8–72 caracteres con mayúscula, minúscula y número.
- El perfil se consulta/edita en `GET/PATCH /api/v1/profile/me`; el avatar es una URL opcional con fallback a la inicial. `GET /auth/me` (autenticado) devuelve el usuario del token y lo usa el frontend para refrescar la sesión.
- Errores de auth/permisos en inglés; el frontend los traduce al español.
- Módulo único de contenido: `events`. Los campos de `trailRoute` (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- La edición desde el dashboard (`/events/:id/edit`) solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm` y `elevationGain`; el resto se conserva por actualización parcial.
- Mapa sin dependencias externas: iframe embebido de OpenStreetMap en `event-map.ts`. Leaflet eliminado.
- Borrado lógico = `deleted_at` con fecha. `restoreById` filtra por `deleted_at != null`.
- Eliminar definitivo solo desde la papelera. Todo se opera por ID, no por slug.
- `slug` de eventos generado desde el nombre con `buildUniqueSlug` (sufijos `-2`, `-3`…); en `update` se ignora el propio evento.
- Reglas numéricas de eventos: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`.
- `sku` de eventos obligatorio y único; el seed incluye un `sku` por evento.
- Seed en `config/database.js` (`seedDatabase()`), ejecutado con `npm run seed`. Es destructivo para contenido (hosts, categorías, ubicaciones, eventos, experiencias e imágenes), pero no borra usuarios/perfiles.
- Usuarios demo: `admin@mudandpace.com`, `admin2@mudandpace.com` y `user@mudandpace.com` (credenciales generadas por el seed).
- Listados sin límite fijo. Paginación futura debe ser explícita.

## Verificación
- `npm run build` en `frontend/` pasa correctamente.
- Tests frontend: 40 specs (AuthStore, guards auth/guest/admin, interceptores auth y error) en Karma + Jasmine; ejecutados con `CHROME_BIN` apuntando a Edge headless → 40/40 SUCCESS.
- Prueba manual de UI (Edge headless, 17/17): login USER, recarga con refresh `GET /auth/me`, expiración con returnUrl + limpieza de localStorage, logout + recarga sin sesión, USER redirigido de `/events/create` y `/events/trash`, ADMIN accediendo a ambas.
- Smoke test manual de la API superado: health, login, `/auth/me`, perfil, registro, logout con revocación y RBAC.
- Base de datos verificada: 3 usuarios, 3 perfiles; 1 host, 2 categorías, 12 ubicaciones, 12 eventos, 1 experiencia y 1 imagen de experiencia.

## Limitaciones conocidas
- Sin tests automatizados en el backend (verificación manual contra la API).
- `npm audit` del backend sin vulnerabilidades (Zod 4.6.7 y body-parser 1.20.9).
- Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.

## Pendiente
- Revisión visual manual de las pantallas de auth y perfil en navegador.
