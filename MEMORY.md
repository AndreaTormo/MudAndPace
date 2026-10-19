# MEMORY.md — MudAndPace v4

Memoria del proyecto entre sesiones. Breve y actualizada.

## Estado actual
- v4 con backend (Express + Mongoose) y frontend (Angular 18) funcionales.
- Papelera implementada en rutas y eventos (restaurar + eliminar definitivamente).
- Panel de administración en sidebar con acceso directo a las papeleras (sin gating).

## Decisiones
- `trailRoutes` es el módulo principal de eventos (no renombrar).
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
- Verificar conteo real de eventos en MongoDB tras el seed (10 eventos).
