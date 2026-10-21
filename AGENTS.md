# AGENTS.md — MudAndPace v4

Monorepo del proyecto de trail running. Dos aplicaciones npm independientes (sin `package.json` raíz ni workspace). Ejecuta cada comando desde su carpeta.

```text
trail-running-api_v3/trail-running-api/   API Express + Mongoose (CommonJS, JS)
trail_running_frontend_v3/                App Angular 18 (TypeScript, standalone)
```

## Comandos

```bash
# API  (http://localhost:3000, health en /health)
npm install                      # en trail-running-api_v3/trail-running-api
npm run dev                      # nodemon
npm start                        # node src/app.js
npm run seed                     # node src/seed.js  (eventos de ejemplo)
docker compose up -d             # mongo:8 en 27017, volumen mongodb_data

# Frontend  (http://localhost:4200)
npm install                      # en trail_running_frontend_v3
npm start                        # ng serve
npm run build                    # typecheck + build de producción
```

No hay tests ni linter. La verificación del frontend es `ng build` sin errores.

## Recargar la base de datos

El seed de datos de ejemplo ya no vive en `init-db.js`: está en `src/config/database.js` (`seedDatabase()`) y se ejecuta con el script npm.

```bash
cd trail-running-api_v3/trail-running-api && npm run seed
```

Esto repuebla hosts, categorías, ubicaciones (12) y eventos (12), además de experiencias e imágenes. Un volumen Docker nuevo queda vacío hasta ejecutar `npm run seed`.

Si el frontend muestra menos eventos de los esperados, comprueba primero `db.events.countDocuments({})` en MongoDB.

## Arquitectura de la API

Flujo fijo: `routes/ → controllers/ → services/ → repositories/ → models/`.

- Los controladores son finos y devuelven `{ success, message, data }`.
- Errores: `AppError(msg, status, code, details)` desde `src/utils/appError.js`. Respuesta `{ error: { code, message, details? } }`.
- `express-async-errors` está importado en `app.js`.
- Validación doble: `validate.middleware.js` (body/params/query) y de nuevo en el servicio. Ambos deben actualizarse para un campo nuevo.
- Los esquemas Zod son `.strict()`: cualquier clave desconocida devuelve 400 `VALIDATION_ERROR`.

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

## Arquitectura del frontend

Página → Store (signals) → Service (único que conoce la URL) → `ApiService` → `HttpClient`. Los componentes nunca inyectan el servicio directamente.

- Componentes standalone + `ChangeDetectionStrategy.OnPush` + plantilla inline (sin `.html` por componente). Estilos en `src/styles.css`.
- Estado con Angular signals (sin NgRx), expuestos vía `.asReadonly()`.
- Rutas lazy con `loadComponent`.
- Componentes compartidos: `navbar`, `sidebar`, `loader`, `skeleton-loader`, `empty-state`, `error-state`, `event-map`.

### Panel de administración

- `Sidebar` en `shared/components/sidebar` con secciones "Principal" y "Administración".
- La sección "Administración" es siempre visible (acceso directo a las papeleras). Ya no existe `AuthStore` ni `AdminGuard`.
- La ruta `/events/trash` es accesible sin gating de UI.

### Eventos

- Módulo único de contenido. El antiguo módulo `trailRoute` (rutas) se eliminó y sus campos propios (`difficulty`, `surface`, `tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`.
- `buildUniqueSlug(name, excludeId)` en `event.service.js` deriva el slug del nombre con `utils/slugify.js` y resuelve colisiones con sufijos `-2`, `-3`… En `update` se ignora el propio evento.
- Reglas de negocio numéricas: `distanceKm > 0`, `elevationGain >= 0`, `price >= 0`.
- Edición desde el dashboard (`/events/:id/edit`): el formulario solo permite modificar `name`, `description`, `categoryId`, `locationId`, `distanceKm` y `elevationGain`. El resto de campos se conservan (actualización parcial).
- `slugify` vive en `src/utils/slugify.js`; `utils/appError.js` lo reexporta por compatibilidad.

### Listados sin límite

No introducir límites fijos (`limit`, `slice`, etc.) en los listados. Si se añade paginación en el futuro, debe ser explícita (`page`/`pageSize` + total) y no ocultar elementos silenciosamente.

## Convenios

- UI en español; identificadores, tipos y códigos de error en inglés.
- Ficheros UTF-8 con acentos.
