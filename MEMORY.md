# MEMORY.md — MudAndPace v4

Memoria del proyecto entre sesiones. Breve y actualizada.

## Estado actual
- v4 con backend (Express + Mongoose) y frontend (Angular 18) funcionales.
- Papelera implementada en rutas y eventos (restaurar + eliminar definitivamente).
- Panel de administración en sidebar con guard de UI.

## Decisiones
- `trailRoutes` es el módulo principal de eventos (no renombrar).
- Borrado lógico = `deleted_at` con fecha. `restoreById` filtra por `deleted_at != null`.
- Eliminar definitivo solo desde la papelera.
- Todo se opera por ID, no por slug. Sin conflictos de slug.
- Control de acceso: guard de UI (`AuthStore` + `AdminGuard`). Sin auth real en backend.
- Listados sin límite fijo. Paginación futura debe ser explícita.

## Limitaciones conocidas
- No hay autenticación ni autorización real en backend.
- No hay tests automatizados (verificación manual + `ng build`).
- El volumen Docker puede contener datos obsoletos si no se reinicia con `mongosh < ../../init-db.js`.

## Pendiente
- Verificar conteo real de eventos en MongoDB vs `init-db.js` (10 eventos).
- Considerar auth real (JWT + roles) si el panel administrativo requiere seguridad.
