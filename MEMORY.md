# MEMORY.md — MudAndPace v4

Memoria del proyecto entre sesiones. Breve y actualizada.

## Estado actual
- v4 con backend (Express + Mongoose) y frontend (Angular 18) funcionales.
- Módulo único de contenido: `events`. El módulo `trailRoute` (rutas) se eliminó.
- Papelera implementada en eventos (restaurar + eliminar definitivamente).
- Panel de administración en sidebar con acceso directo a la papelera (sin gating).
- Mapa de ubicación en el detalle de eventos mediante iframe de OpenStreetMap (sin Leaflet).

## Decisiones
- Módulo único de contenido: `events`. El antiguo `trailRoute` se eliminó y sus campos propios (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- La edición desde el dashboard (`/events/:id/edit`) solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm` y `elevationGain`; el resto se conserva por actualización parcial.
- Mapa sin dependencias externas: iframe embebido de OpenStreetMap en `event-map.ts`. Leaflet eliminado.
- Borrado lógico = `deleted_at` con fecha. `restoreById` filtra por `deleted_at != null`.
- Eliminar definitivo solo desde la papelera.
- Todo se opera por ID, no por slug.
- `slug` de eventos generado desde el nombre con `buildUniqueSlug` (sufijos `-2`, `-3`…); en `update` se ignora el propio evento.
- Reglas numéricas de eventos: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`.
- Módulo de auth eliminado (frontend y seed). Sin `AuthStore`, `AdminGuard`, `users` ni `roles`.
- Seed de ejemplo en `config/database.js` (`seedDatabase()`), ejecutado con `npm run seed`. `init-db.js` ya no existe.
- Listados sin límite fijo. Paginación futura debe ser explícita.

## Limitaciones conocidas
- No hay tests automatizados (verificación manual + `ng build`).
- Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.

## Pendiente
- Verificar conteo real de eventos en MongoDB tras el seed (12 eventos).
- Revisar `README.md` (raíz y de cada app), que aún describen el módulo de rutas.
