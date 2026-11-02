# Mud and Pace — Frontend

Aplicación Angular 18 para consultar y administrar eventos de trail running, con autenticación JWT,
perfil de usuario y control de acceso por roles. Consume la API Express en
`http://localhost:3000/api/v1`.

## Requisitos

- Node.js 18 o superior con npm
- La API y MongoDB levantados en `http://localhost:3000` (ver `../backend`)

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
| `npm test`      | Tests Karma + Jasmine (`ng test`)        |

Tests en `src/app/**/*.spec.ts` (AuthStore, guards e interceptores). Sin Chrome en el sistema:

```bash
CHROME_BIN="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" npx ng test --watch=false --browsers=ChromeHeadless
```

## Estructura

```text
src/
├── environments/            environment.ts (producción) y environment.development.ts
├── styles.css               Tailwind + helpers (.form-*, .button-*, .badge*)
└── app/
    ├── core/
    │   ├── guards/          auth.guard (authGuard + guestGuard) y admin.guard (adminGuard)
    │   ├── interceptors/    loading + auth (Bearer, expiración, endpoints auth) + error (SweetAlert2 en español)
    │   ├── models/          interfaces de API, auth y eventos
    │   ├── services/        ApiService, AuthService, UserService, EventService y ReferenceService
    │   └── stores/          AuthStore, EventsStore y EventImagesStore (signals)
    ├── features/
    │   ├── auth/            layout, rutas y páginas de login/registro/verificación/reset
    │   ├── events/          componentes y páginas de eventos
    │   └── profile/         perfil del usuario autenticado
    ├── layouts/main-layout/ navbar + sidebar + <router-outlet>
    └── shared/              componentes y utilidades compartidas
```

Flujo de datos: página → store → service → `ApiService` → `HttpClient`; los componentes hijos solo
reciben inputs/emiten outputs.

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/auth/login` | Público (`guestGuard`) | Login |
| `/auth/register` | Público (`guestGuard`) | Registro |
| `/auth/verify-email` | Público | Verificación de email |
| `/auth/forgot-password` | Público (`guestGuard`) | Solicitar reset |
| `/auth/reset-password` | Público | Nueva contraseña |
| `/events` | Autenticado | Listado |
| `/events/:id` | Autenticado | Detalle |
| `/events/create` | `ADMIN` | Crear evento |
| `/events/:id/edit` | `ADMIN` | Editar evento |
| `/events/trash` | `ADMIN` | Papelera |
| `/profile` | Autenticado | Perfil |

## Autenticación

- `AuthStore` persiste token + usuario + `expiresAt` en `localStorage` (`mudandpace.auth`): la UI arranca rápido desde la caché y `MainLayout` refresca con `GET /auth/me`.
- `authInterceptor` añade `Authorization: Bearer <token>`; si el token ya caducó aborta antes de enviar (clear + redirect sin popup). En un 401: login/registro no hacen nada (credenciales), logout solo limpia, el resto limpia y redirige a `/auth/login` con `returnUrl`.
- Expiración por timer en cliente: marca `sessionExpired` y `MainLayout` redirige con `returnUrl`.
- `errorInterceptor` traduce los errores de la API al español (401/403, red, timeout, respuestas inválidas, details de Zod).
- `AuthStore.isAuthenticated()` comprueba además la expiración del token.
- La UI oculta las acciones de administración a `USER`, pero la autorización real está en la API.

## Variables de entorno

`src/environments/environment.ts` (producción) y `environment.development.ts`, intercambiadas con
`fileReplacements` en `angular.json`:

| Clave            | Valor                              | Uso                                        |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `production`     | `true` / `false`                   | Modo de compilación                        |
| `API_URL`        | `http://localhost:3000/api/v1`     | Base de todos los endpoints                |
| `requestTimeout` | `10000` (ms)                       | Timeout de cada petición en `ApiService`   |

## Funcionalidades

- Login, registro, verificación de email, reenvío, olvido y reset de contraseña.
- Perfil editable: nombre, datos personales, avatar y logout.
- Listado de eventos con filtros (estado, categoría, ubicación, distancia, fechas) y búsqueda por ID
  hexadecimal de 24 caracteres.
- Alta y edición de eventos solo para `ADMIN`. Desde el dashboard solo se editan `name`, `description`,
  `categoryId`, `locationId`, `distanceKm` y `elevationGain`.
- Detalle con caché, mapa de ubicación (OpenStreetMap embebido) y características técnicas.
- Publicar/despublicar, borrado lógico y recuperación, con confirmación SweetAlert2.
- Papelera con restauración y eliminación definitiva, solo para `ADMIN`.
- Manejo centralizado de errores, estados de carga, errores y resultados vacíos.
- Todos los componentes usan `ChangeDetectionStrategy.OnPush` y signals.
