# Mud and Pace — Frontend

Aplicación Angular 18 para consultar y administrar rutas de trail running. Consume la API Express
`trail-running-api_v3` (`http://localhost:3000/api/v1`).

## Requisitos

- Node.js 18 o superior con npm
- La API y su MongoDB levantados en `http://localhost:3000` (ver `../trail-running-api_v3/trail-running-api`)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

Arranca `ng serve` en `http://localhost:4200/` y recarga al guardar cambios. Las llamadas a la API
salen desde el navegador hacia `http://localhost:3000` (CORS habilitado en la API para el puerto 4200).

## Build de producción

```bash
npm run build
```

Los artefactos quedan en `dist/trail_running_frontend_v3/`.

## Scripts

| Comando         | Descripción                              |
| --------------- | ---------------------------------------- |
| `npm start`     | Servidor de desarrollo (`ng serve`)      |
| `npm run build` | Build de producción (`ng build`)         |

No hay suite de tests: la verificación del proyecto es un `npm run build` sin errores.

## Estructura

```text
src/
├── environments/            environment.ts (producción) y environment.development.ts
├── styles.css               Tailwind + helpers (.form-*, .button-*, .badge*)
└── app/
    ├── core/
    │   ├── interceptors/    loading + error (SweetAlert2 en español)
    │   ├── models/          interfaces TrailRoute, RouteFilters, ApiResponse
    │   ├── services/        ApiService (HTTP + timeout) y TrailRouteService (único fichero con la URL)
    │   └── stores/          TrailRoutesStore (signals; selectedRoute, loading, error, stale)
    ├── features/routes/
    │   ├── components/      route-card, route-grid, route-filters, route-form (compartido)
    │   ├── pages/           route-list, route-detail, route-create, route-edit
    │   └── routes.routes.ts rutas: '' (lista), create, :id/edit, :id
    ├── layouts/main-layout/ navbar + <router-outlet>
    └── shared/              navbar, loader, skeleton, empty/error states, utils (validators, format, error.util)
```

Flujo de datos: página → store → `TrailRouteService` → `ApiService` → `HttpClient`; los componentes
hijos solo reciben inputs/emiten outputs.

## Variables de entorno

`src/environments/environment.ts` (producción) y `environment.development.ts`, intercambiadas con
`fileReplacements` en `angular.json`:

| Clave            | Valor                              | Uso                                        |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `production`     | `true` / `false`                   | Modo de compilación                        |
| `API_URL`        | `http://localhost:3000/api/v1`     | Base de todos los endpoints                |
| `requestTimeout` | `10000` (ms)                       | Timeout de cada petición en `ApiService`   |

## Funcionalidades

- Listado con filtros (dificultad, país, región, distancia, estado de publicación) y búsqueda por
  ID hexadecimal de 24 caracteres (validada con Reactive Forms).
- Alta y edición de rutas con validación en cliente (URLs http(s), campos obligatorios) y mensajes
  accesibles (`role="alert"`, `aria-invalid`/`aria-describedby`).
- Detalle con caché: si el store ya tiene esa ruta y no está desactualizada, no repite la petición.
- Borrado lógico (soft delete) y recuperación, con confirmación SweetAlert2 y refresco de la lista.
- Manejo de errores centralizado: el interceptor traduce los códigos de la API a mensajes en
  español (incluye el desglose `details` de Zod en los 400) y `error.util` cubre errores no HTTP
  (respuestas inválidas, timeouts).
- Todos los componentes usan `ChangeDetectionStrategy.OnPush` y signals.
