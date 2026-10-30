# Trail Running API

API REST con **Node.js + Express + MongoDB/Mongoose** para gestionar eventos de trail running, con
autenticación JWT, usuarios, perfiles y control de acceso por roles.

## Arquitectura

```text
src/
├── config/
│   └── database.js              # conexión + seedDatabase()
├── controllers/
│   ├── auth.controller.js
│   ├── event.controller.js
│   ├── eventImage.controller.js
│   ├── reference.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── authenticate.middleware.js
│   ├── authorize.middleware.js
│   ├── error.middleware.js
│   ├── upload.middleware.js
│   └── validate.middleware.js
├── models/
│   ├── category.model.js
│   ├── event.model.js
│   ├── eventImage.model.js
│   ├── host.model.js
│   ├── location.model.js
│   ├── profile.model.js
│   └── user.model.js
├── policies/
│   └── access.policy.js         # reglas ABAC
├── repositories/
│   ├── event.repository.js
│   ├── eventImage.repository.js
│   ├── profile.repository.js
│   └── user.repository.js
├── routes/
│   ├── auth.routes.js
│   ├── event.routes.js
│   ├── reference.routes.js
│   └── user.routes.js
├── services/
│   ├── auth.service.js
│   ├── email.service.js
│   ├── errors.js
│   ├── event.service.js
│   ├── eventImage.service.js
│   ├── profile.service.js
│   ├── reference.service.js
│   └── user.service.js
├── utils/
│   ├── appError.js
│   ├── jwt.js
│   ├── publicUser.js
│   ├── sku.js
│   ├── slugify.js
│   ├── token.js
│   └── validation.js
├── validators/
│   ├── auth.validator.js
│   ├── event.validator.js
│   ├── profile.validator.js
│   └── user.validator.js
├── app.js
└── seed.js
```

### Responsabilidades

- **Routes**: definición de endpoints HTTP y aplicación de auth/RBAC.
- **Controllers**: traducen HTTP a llamadas de servicio y construyen respuestas.
- **Services**: reglas de negocio y control/normalización de errores.
- **Repositories**: acceso a MongoDB.
- **Models**: esquema y validaciones de Mongoose.
- **Middlewares**: autenticación, autorización, validación con Zod, uploads, CORS, logging, 404 y errores.

## Requisitos

- Node.js 18+
- MongoDB 6+ o Docker

## Instalación

```bash
npm install
cp .env.example .env
```

Edita `.env` si necesitas cambiar la conexión.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/trail_running
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
JWT_SECRET=change-me-with-a-long-random-secret
JWT_EXPIRES_IN=1h
APP_URL=http://localhost:4200
```

`JWT_SECRET` es obligatorio: la API no arranca sin él.

### Con MongoDB local

```bash
npm run dev
```

### Con Docker

```bash
docker compose up -d
npm run dev
```

### Cargar datos de ejemplo

El seed está en `src/config/database.js` y se ejecuta con:

```bash
npm run seed
```

- Repuebla hosts (1), categorías (2), ubicaciones (12), eventos (12), experiencias (1) e imágenes.
- Es destructivo para ese contenido: elimina y vuelve a insertar.
- No borra usuarios ni perfiles; los actualiza por email con `upsert`.
- Crea tres usuarios demo verificados:

| Rol | Email | Contraseña |
|---|---|---|
| `ADMIN` | `admin@mudandpace.com` | `Admin123!` |
| `ADMIN` | `admin2@mudandpace.com` | `Admin123!` |
| `USER` | `user@mudandpace.com` | `User123!` |

Los eventos requieren `sku` único; los datos del seed ya lo incluyen.

## Autenticación

- Login con `POST /api/v1/auth/login`. Devuelve `{ token, expiresAt, user }` dentro de `data`.
- Envía el token con `Authorization: Bearer <token>`.
- JWT HS256, `JWT_EXPIRES_IN=1h` por defecto, sin refresh token.
- Roles `USER` y `ADMIN`; los tokens incluyen `sub` y `ver`.
- Verificación de email y reset de contraseña: los enlaces se imprimen por consola (no hay SMTP).
- Rate limiting: 30 peticiones/15 min en auth y 10/15 min en login.

## Endpoints

### Auth (`/api/v1/auth`, público)

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/register` | Registro |
| POST | `/login` | Login |
| POST | `/verify-email` | Verifica email con token |
| POST | `/resend-verification` | Reenvía verificación |
| POST | `/forgot-password` | Solicita reset |
| POST | `/reset-password` | Cambia contraseña con token |

### Usuarios (`/api/v1/users`, autenticado)

| Método | Endpoint | Acceso |
|---|---|---|
| GET | `/:id` | Propio usuario o `ADMIN` |
| PATCH | `/:id` | Propio usuario o `ADMIN` |
| GET | `/:id/profile` | Propio usuario o `ADMIN` |
| PATCH | `/:id/profile` | Propio usuario o `ADMIN` |

No existe `GET /me`; el frontend usa el `_id` devuelto en login.

### Eventos (`/api/v1/events`, autenticado)

| Método | Endpoint | Acceso / Descripción |
|---|---|---|
| GET | `/` | Lista con filtros |
| GET | `/deleted` | Solo `ADMIN`; papelera |
| GET | `/:id` | Detalle por ID |
| GET | `/slug/:slug` | Detalle por slug |
| GET | `/:id/images` | Imágenes del evento |
| POST | `/` | Solo `ADMIN`; crea |
| PUT | `/:id` | Solo `ADMIN`; actualiza |
| PATCH | `/:id/publish` | Solo `ADMIN`; publica |
| PATCH | `/:id/unpublish` | Solo `ADMIN`; pasa a borrador |
| PATCH | `/:id/soft-delete` | Solo `ADMIN`; papelera |
| PATCH | `/:id/restore` | Solo `ADMIN`; restaura |
| DELETE | `/:id` | Solo `ADMIN`; papelera |
| DELETE | `/:id/permanent` | Solo `ADMIN`; elimina definitivamente |
| POST | `/:id/images` | Solo `ADMIN`; sube hasta 8 imágenes |
| PATCH | `/:id/images/:imageId/cover` | Solo `ADMIN`; marca portada |
| DELETE | `/:id/images/:imageId` | Solo `ADMIN`; elimina imagen |

Filtros de listado: `status` (`published`, `draft`, `all`), `categoryId`, `locationId`, `hostId`,
`minDistance`, `maxDistance`, `fromDate`, `toDate`, `isActive`.

### Referencias (`/api/v1/references`, autenticado)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/categories` | Lista categorías activas |
| GET | `/locations` | Lista ubicaciones activas |
| GET | `/hosts` | Lista organizadores activos |

### Health

```text
GET http://localhost:3000/health
```

## Formato de errores

```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found"
  }
}
```

Los errores de validación añaden `details`. Los códigos de auth/permisos habituales son
`AUTHENTICATION_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`,
`EMAIL_NOT_VERIFIED`, `FORBIDDEN` y `TOO_MANY_REQUESTS`.

## Ejemplo de payload de evento

```json
{
  "name": "Ultra Trail Vall de Boí 2027",
  "sku": "UTVB-2027",
  "description": "Carrera por los lagos de la Vall de Boí.",
  "hostId": "665a1b2c3d4e5f60718293b5",
  "categoryId": "665a1b2c3d4e5f60718293c6",
  "locationId": "665a1b2c3d4e5f60718293d7",
  "startDate": "2027-06-12T07:00:00.000Z",
  "endDate": "2027-06-12T19:00:00.000Z",
  "distanceKm": 68.5,
  "elevationGain": 4200,
  "elevationLossM": 950,
  "difficulty": "hard",
  "surface": ["trail", "rock", "mixed"],
  "tags": ["pirineos", "lagos", "circular"],
  "gpxUrl": "https://example.com/vall-boi.gpx",
  "price": 85,
  "status": "published",
  "isActive": true
}
```

## CORS

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

Si hay varios orígenes, sepáralos por comas.

## Postman

Consulta `postman.md` para probar los endpoints con autenticación.

## Nota de migración

El antiguo módulo `trailRoute` (rutas) se eliminó y sus campos propios (`difficulty`, `surface`,
`tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`. `Event` es ahora el módulo único
de contenido.

No hay tests automatizados en el repositorio; la verificación se hace manualmente contra la API.
