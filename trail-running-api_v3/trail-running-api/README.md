# Trail Running API

API REST con **Node.js + Express + MongoDB/Mongoose** para gestionar rutas de trail running, pensada como backend para una aplicación de exploración de rutas inspirada en la experiencia de plataformas de trail running.

> Este proyecto se centra en la API y no incluye frontend ni identidad visual de terceros.

## Arquitectura

```text
src/
├── config/
│   └── database.js
├── controllers/
│   └── trailRoute.controller.js
├── middlewares/
│   ├── error.middleware.js
│   └── notFound.middleware.js
├── models/
│   └── trailRoute.model.js
├── repositories/
│   └── trailRoute.repository.js
├── routes/
│   └── trailRoute.routes.js
├── services/
│   ├── errors.js
│   └── trailRoute.service.js
├── app.js
└── seed.js
```

### Responsabilidades

- **Routes**: definición de endpoints HTTP.
- **Controllers**: traducen HTTP a llamadas de servicio y construyen respuestas.
- **Services**: reglas de negocio y control/normalización de errores.
- **Repositories**: acceso a MongoDB.
- **Models**: esquema y validaciones de Mongoose.
- **Middlewares**: CORS, logging, 404 y gestión final de errores.

## Requisitos

- Node.js 18+
- MongoDB 6+ o Docker

## Instalación

```bash
npm install
cp .env.example .env
```

Edita `.env` si necesitas cambiar la conexión.

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

Las rutas de ejemplo:

```bash
node src/seed.js
```

Los eventos, organizadores, categorías y ubicaciones se cargan automáticamente al
arrancar MongoDB con Docker (`init-db.js` se ejecuta desde `docker-entrypoint-initdb.d`).
Para recargarlos manualmente:

```bash
docker exec trail-running-mongodb mongosh < ../../init-db.js
```

## Endpoints

Base URL:

```text
http://localhost:3000/api/v1/routes
```

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/deleted` | Lista rutas en la papelera |
| GET | `/` | Lista rutas con filtros |
| GET | `/:id` | Obtiene una ruta por ID |
| GET | `/slug/:slug` | Obtiene una ruta por slug |
| GET | `/nearby` | Busca rutas cercanas |
| POST | `/` | Crea una ruta |
| PUT | `/:id` | Actualiza una ruta |
| PATCH | `/:id/soft-delete` | Envía una ruta a la papelera |
| PATCH | `/:id/restore` | Restaura una ruta de la papelera |
| PATCH | `/:id/activate` | Activa una ruta inactiva |
| PATCH | `/:id/deactivate` | Desactiva una ruta activa |
| DELETE | `/:id` | Envía una ruta a la papelera (soft delete) |
| DELETE | `/:id/permanent` | Elimina definitivamente una ruta de la papelera |

### Eventos

Base URL: `http://localhost:3000/api/v1/events`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/deleted` | Lista eventos en la papelera |
| GET | `/` | Lista eventos con filtros |
| GET | `/:id` | Obtiene un evento por ID |
| GET | `/slug/:slug` | Obtiene un evento por slug |
| POST | `/` | Crea un evento |
| PUT | `/:id` | Actualiza un evento |
| PATCH | `/:id/publish` | Publica un evento (borrador → publicado) |
| PATCH | `/:id/unpublish` | Pasa un evento a borrador |
| PATCH | `/:id/soft-delete` | Envía un evento a la papelera |
| PATCH | `/:id/restore` | Restaura un evento de la papelera |
| DELETE | `/:id` | Envía un evento a la papelera (soft delete) |
| DELETE | `/:id/permanent` | Elimina definitivamente un evento de la papelera |

Filtros de listado: `status` (`published`, `draft`, `all`), `categoryId`, `locationId`, `hostId`, `minDistance`, `maxDistance`, `fromDate`, `toDate`, `isActive`.

### Referencias

Base URL: `http://localhost:3000/api/v1/references`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/categories` | Lista categorías activas |
| GET | `/locations` | Lista ubicaciones activas |
| GET | `/hosts` | Lista organizadores activos |

Health check:

```text
GET http://localhost:3000/health
```

## Filtros

Ejemplo:

```text
GET /api/v1/routes?difficulty=hard&country=España&minDistance=10&maxDistance=40
```

Filtros disponibles:

- `difficulty`: `easy`, `moderate`, `hard`, `expert`
- `country`
- `region`
- `minDistance`
- `maxDistance`
- `isPublished`
- `status`: `active`, `inactive`, `deleted`, `all` (sin filtro devuelve activas e inactivas)

## Búsqueda geográfica

```text
GET /api/v1/routes/nearby?longitude=0.1123&latitude=38.8027&radiusKm=25
```

MongoDB utiliza un índice `2dsphere` sobre `startPoint`.

## CORS

Configura los orígenes permitidos en:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Si hay varios orígenes, sepáralos por comas.

## Formato de errores

Los servicios convierten errores de validación, duplicados, IDs inválidos y errores internos en una estructura uniforme:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ruta no encontrada"
  }
}
```

## Ejemplo de payload

```json
{
  "name": "Montgó Circular",
  "description": "Ruta de montaña con vistas al Mediterráneo.",
  "location": {
    "country": "España",
    "region": "Comunitat Valenciana",
    "province": "Alicante",
    "municipality": "Dénia"
  },
  "startPoint": {
    "type": "Point",
    "coordinates": [0.1123, 38.8027]
  },
  "distanceKm": 14.8,
  "elevationGainM": 720,
  "elevationLossM": 720,
  "difficulty": "hard",
  "surface": ["trail", "rock", "dirt"],
  "tags": ["mediterraneo", "montana", "circular"],
  "imageUrl": "https://example.com/montgo.jpg",
  "gpxUrl": "https://example.com/montgo.gpx",
  "isPublished": true
}
```

## Postman

Consulta `postman.md` para importar/crear las peticiones y probar todos los endpoints.

## Evolución recomendada

Para acercar el producto a una plataforma completa de trail running, se pueden añadir posteriormente:

- usuarios y perfiles;
- favoritos y listas;
- tracks GPX y geometrías `LineString`;
- carreras/eventos;
- clasificaciones;
- comentarios;
- fotos;
- estadísticas de desnivel;
- paginación;
- autenticación JWT;
- roles de usuario;
- subida de archivos;
- caché y rate limiting.

## Cambios de la versión 2

- `slug` y consulta `GET /api/v1/routes/slug/:slug`.
- Soft delete: `DELETE /api/v1/routes/:id` o `PATCH /api/v1/routes/:id/soft-delete` pasan la ruta a
  `isActive: false` / `status: "inactive"` sin tocar `deleted_at`. Borrar una ruta ya inactiva
  devuelve 409 `ROUTE_ALREADY_INACTIVE`.
- Restauración: `PATCH /api/v1/routes/:id/restore` solo activa rutas inactivas; si ya está activa
  devuelve 409 `ROUTE_ALREADY_ACTIVE`.
- Activación/desactivación: `PATCH /api/v1/routes/:id/activate` y `PATCH /api/v1/routes/:id/deactivate`
  con las mismas precondiciones (409 si no corresponden).
- El modelo expone `slug`, `isActive`, `status`, `created_At`, `deleted_at` y `updated_at`.
- `deleted_at` queda reservado para registros antiguos; `GET /api/v1/routes` devuelve activas e
  inactivas por defecto (acepta `?status=`).
- Validación con Zod tanto en las rutas mediante middleware como en la capa de servicio.
- `AppError` centralizado en `src/utils/appError.js`.
- `helmet` y `morgan` configurados en `src/app.js`.
