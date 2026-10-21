# Mud and Pace — Frontend

Aplicación Angular 18 para consultar y administrar eventos de trail running. Consume la API Express
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
    │   ├── models/          interfaces Event, EventPayload, ApiResponse
    │   ├── services/        ApiService (HTTP + timeout), EventService y ReferenceService (URLs)
    │   └── stores/          EventsStore (signals; selectedEvent, loading, error, stale)
    ├── features/events/
    │   ├── components/      event-row, event-filters, event-form
    │   ├── pages/           event-list, event-detail, event-create, event-edit, event-trash
    │   └── events.routes.ts rutas: '' (lista), create, :id/edit, :id, trash
    ├── layouts/main-layout/ navbar + sidebar + <router-outlet>
    └── shared/              navbar, sidebar, loader, skeleton, empty/error states, event-map, utils
```

Flujo de datos: página → store → `EventService` → `ApiService` → `HttpClient`; los componentes
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

- Listado con filtros (estado, categoría, ubicación, distancia, fechas) y búsqueda por ID hexadecimal
  de 24 caracteres (validada con Reactive Forms).
- Alta y edición de eventos con validación en cliente y mensajes accesibles (`role="alert"`,
  `aria-invalid`/`aria-describedby`). Desde el dashboard solo se pueden editar `name`, `description`,
  `categoryId`, `locationId`, `distanceKm` y `elevationGain`.
- Detalle con caché: si el store ya tiene ese evento y no está desactualizado, no repite la petición.
  Incluye mapa de ubicación (OpenStreetMap embebido, sin dependencias) y características técnicas
  (dificultad, superficies, etiquetas, desnivel negativo, GPX).
- Publicar/despublicar, borrado lógico (soft delete) y recuperación, con confirmación SweetAlert2 y
  refresco de la lista. Papelera con restauración y eliminación definitiva.
- Manejo de errores centralizado: el interceptor traduce los códigos de la API a mensajes en
  español (incluye el desglose `details` de Zod en los 400) y `error.util` cubre errores no HTTP
  (respuestas inválidas, timeouts).
- Todos los componentes usan `ChangeDetectionStrategy.OnPush` y signals.
