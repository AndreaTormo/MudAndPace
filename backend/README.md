# Trail Running API

API REST con **Node.js + Express + MongoDB/Mongoose** para gestionar eventos de trail running, pensada
como backend para una aplicación de exploración de carreras inspirada en la experiencia de
plataformas de trail running.

> Este proyecto se centra en la API y no incluye frontend ni identidad visual de terceros.

## Arquitectura

```text
src/
├── config/
│   └── database.js
├── controllers/
│   ├── event.controller.js
│   └── reference.controller.js
├── middlewares/
│   ├── error.middleware.js
│   ├── notFound.middleware.js
│   └── validate.middleware.js
├── models/
│   ├── category.model.js
│   ├── event.model.js
│   ├── host.model.js
│   └── location.model.js
├── repositories/
│   └── event.repository.js
├── routes/
│   ├── event.routes.js
│   └── reference.routes.js
├── services/
│   ├── errors.js
│   ├── event.service.js
│   └── reference.service.js
├── utils/
│   ├── appError.js
│   └── slugify.js
├── app.js
└── seed.js
```

### Responsabilidades

- **Routes**: definición de endpoints HTTP.
- **Controllers**: traducen HTTP a llamadas de servicio y construyen respuestas.
- **Services**: reglas de negocio y control/normalización de errores.
- **Repositories**: acceso a MongoDB.
- **Models**: esquema y validaciones de Mongoose.
- **Middlewares**: validación con Zod, CORS, logging, 404 y gestión final de errores.

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

Los eventos, organizadores, categorías y ubicaciones de ejemplo se cargan con el script de seed (el
antiguo `init-db.js` se integró en `src/config/database.js`):

```bash
npm run seed
```

## Endpoints

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

Filtros de listado: `status` (`published`, `draft`, `all`), `categoryId`, `locationId`, `hostId`,
`minDistance`, `maxDistance`, `fromDate`, `toDate`, `isActive`.

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

## CORS

Configura los orígenes permitidos en:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

Si hay varios orígenes, sepáralos por comas.

## Formato de errores

Los servicios convierten errores de validación, duplicados, IDs inválidos y errores internos en una estructura uniforme:

```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Evento no encontrado"
  }
}
```

## Ejemplo de payload

```json
{
  "name": "Ultra Trail Vall de Boí 2027",
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

## Postman

Consulta `postman.md` para importar/crear las peticiones y probar todos los endpoints.

## Nota de migración

El antiguo módulo `trailRoute` (rutas) se eliminó y sus campos propios (`difficulty`, `surface`,
`tags`, `elevationLossM`, `gpxUrl`) se migraron al modelo `Event`. `Event` es ahora el módulo único
de contenido.

## Evolución recomendada

Para acercar el producto a una plataforma completa de trail running, se pueden añadir posteriormente:

- usuarios y perfiles;
- favoritos y listas;
- tracks GPX y geometrías `LineString`;
- clasificaciones;
- comentarios;
- fotos;
- estadísticas de desnivel;
- paginación;
- subida de archivos;
- caché y rate limiting.
