<div align="center">

<img src="./Mountain1.png" alt="Logo de MudAndPace" width="200">

<br>
<br>

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-E0A526?style=for-the-badge&logo=github&logoColor=white)
![Trail Running](https://img.shields.io/badge/Trail%20Running-8B5A2B?style=for-the-badge&logo=strava&logoColor=white)
![Montaña](https://img.shields.io/badge/Monta%C3%B1a-4A6741?style=for-the-badge&logo=mountdotcom&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-C2793A?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

MudAndPace es una plataforma web centrada en el mundo del trail running, concebida para explorar experiencias de montaña y acercar a los corredores a la emoción de las carreras de trail, inspiradas en circuitos como UTMB World Series y Golden Trail World Series (GTWS).

El proyecto está desarrollado con **Angular** para el frontend y una **API REST con Node.js, Express y MongoDB** para el backend. Actualmente permite registrarse, iniciar sesión, gestionar el perfil y consultar eventos de trail running; los administradores pueden crear, editar, publicar y gestionar eventos y su papelera.

## ✨ Funcionalidades

### Frontend
- Registro, login, verificación de email, reenvío, olvido y reset de contraseña.
- Perfil editable con datos personales, avatar y logout.
- Guards `authGuard`, `adminGuard` y `guestGuard`; interceptor que añade el Bearer y redirige ante 401.
- Listado de eventos con filtros por estado, categoría, ubicación, distancia y fechas.
- Búsqueda de eventos por su identificador.
- Páginas de detalle con mapa de ubicación (OpenStreetMap) y características técnicas.
- Formularios para crear y editar eventos con validaciones en el cliente, solo para `ADMIN`.
- Edición desde el dashboard limitada a `name`, `description`, `categoryId`, `locationId`, `distanceKm` y `elevationGain`.
- Gestión de eventos: publicar/despublicar y borrado lógico con recuperación.
- Papelera de eventos con restauración y eliminación definitiva, solo para `ADMIN`.
- Navbar/sidebar con secciones de administración visibles solo para `ADMIN`.
- Estados de carga, errores y resultados vacíos.
- Manejo centralizado de errores y mensajes en español.
- Gestión del estado con Angular Signals y componentes con `OnPush`.

### Backend
- Autenticación JWT con verificación de email y reset de contraseña.
- RBAC (`USER`/`ADMIN`) y ABAC para usuarios y perfiles.
- API REST para eventos: listado con filtros, detalle, creación, edición, publicación, imágenes y borrado lógico.
- Modelos de usuario, perfil, organizador, categoría y ubicación.
- Validación de datos con Zod y esquemas de Mongoose.
- Rate limiting en auth y login.
- Gestión centralizada de errores y respuestas uniformes.
- Middleware de seguridad, CORS, logging y gestión de rutas no encontradas.

## 🧰 Tecnologías

| Área | Tecnologías |
|---|---|
| Frontend | Angular 18, TypeScript, HTML, CSS |
| Estado y formularios | Angular Signals, Reactive Forms |
| Estilos e interfaz | Tailwind CSS, SweetAlert2 |
| Mapas | OpenStreetMap embebido (sin dependencias) |
| Backend | Node.js, Express |
| Base de datos | MongoDB, Mongoose |
| Autenticación | JWT, bcryptjs |
| Validación | Zod |
| Middleware y utilidades | Helmet, Morgan, express-rate-limit |
| Comunicación | API REST sobre HTTP |

## 🏗️ Arquitectura

MudAndPace está dividido en dos aplicaciones independientes: frontend y backend.

```text
MudAndPace/
├── backend/
│   └── src/
│       ├── config/          # Configuración de base de datos y seed
│       ├── controllers/     # Controladores HTTP
│       ├── middlewares/     # Auth, RBAC, validación, uploads y errores
│       ├── models/          # Modelos de Mongoose
│       ├── policies/        # Reglas ABAC
│       ├── repositories/    # Acceso a datos
│       ├── routes/          # Endpoints de la API
│       ├── services/        # Lógica de negocio y errores
│       ├── utils/           # JWT, tokens, AppError, slugify, sku…
│       ├── validators/      # Esquemas Zod
│       ├── app.js
│       └── seed.js
└── frontend/
    └── src/
        ├── environments/    # Configuración por entorno
        └── app/
            ├── core/
            │   ├── guards/
            │   ├── interceptors/
            │   ├── models/
            │   ├── services/
            │   └── stores/
            ├── features/
            │   ├── auth/
            │   ├── events/
            │   └── profile/
            ├── layouts/
            └── shared/
```

### Flujo de datos

En el frontend, las páginas interactúan con stores de signals, que utilizan los servicios y `ApiService` para realizar peticiones HTTP mediante `HttpClient`. El backend recibe las peticiones a través de sus rutas, aplica autenticación/autorización, ejecuta la lógica de negocio y accede a MongoDB mediante repositorios y modelos de Mongoose.

## ⚙️ Requisitos

- Node.js 18 o superior y npm.
- MongoDB 6 o superior, o Docker.
- Los paquetes del frontend y del backend instalados.

## 🚀 Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Revisa `.env` y configura, como mínimo, `MONGODB_URI` y `JWT_SECRET`. La API no arranca sin `JWT_SECRET`.

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`.

### 2. Datos de ejemplo (opcional)

```bash
cd backend
npm run seed
```

El seed repuebla eventos, hosts, categorías, ubicaciones, experiencias e imágenes. No borra usuarios ni perfiles, pero sí el contenido existente. Crea estos usuarios verificados:

| Rol | Email | Contraseña |
|---|---|---|
| `ADMIN` | `admin@mudandpace.com` | `Admin123!` |
| `ADMIN` | `admin2@mudandpace.com` | `Admin123!` |
| `USER` | `user@mudandpace.com` | `User123!` |

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Angular arrancará el servidor de desarrollo en `http://localhost:4200/`.

El frontend utiliza por defecto la API configurada en `src/environments/environment.development.ts`, con la URL base `http://localhost:3000/api/v1`.

## 🔌 API REST

Base URL: `http://localhost:3000/api/v1`

Todo requiere autenticación salvo `/auth/*`, `/health` y `/uploads`. Envía el token con `Authorization: Bearer <token>`.

### Auth

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/verify-email` | Verifica email |
| `POST` | `/auth/resend-verification` | Reenvía verificación |
| `POST` | `/auth/forgot-password` | Solicita reset |
| `POST` | `/auth/reset-password` | Cambia contraseña |

### Usuarios

| Método | Endpoint | Acceso |
|---|---|---|
| `GET` | `/users/:id` | Propio usuario o `ADMIN` |
| `PATCH` | `/users/:id` | Propio usuario o `ADMIN` |
| `GET` | `/users/:id/profile` | Propio usuario o `ADMIN` |
| `PATCH` | `/users/:id/profile` | Propio usuario o `ADMIN` |

### Eventos

| Método | Endpoint | Acceso / Descripción |
|---|---|---|
| `GET` | `/events` | Lista eventos y aplica filtros |
| `GET` | `/events/:id` | Obtiene un evento por ID |
| `GET` | `/events/slug/:slug` | Obtiene un evento por slug |
| `GET` | `/events/:id/images` | Imágenes del evento |
| `GET` | `/events/deleted` | Solo `ADMIN`; papelera |
| `POST` | `/events` | Solo `ADMIN`; crea |
| `PUT` | `/events/:id` | Solo `ADMIN`; actualiza |
| `PATCH` | `/events/:id/publish` | Solo `ADMIN`; publica |
| `PATCH` | `/events/:id/unpublish` | Solo `ADMIN`; pasa a borrador |
| `PATCH` | `/events/:id/soft-delete` | Solo `ADMIN`; papelera |
| `PATCH` | `/events/:id/restore` | Solo `ADMIN`; restaura |
| `DELETE` | `/events/:id` | Solo `ADMIN`; papelera |
| `DELETE` | `/events/:id/permanent` | Solo `ADMIN`; elimina definitivamente |
| `POST` | `/events/:id/images` | Solo `ADMIN`; sube imágenes |
| `PATCH` | `/events/:id/images/:imageId/cover` | Solo `ADMIN`; marca portada |
| `DELETE` | `/events/:id/images/:imageId` | Solo `ADMIN`; elimina imagen |

Filtros de listado: `status` (`published`, `draft`, `all`), `categoryId`, `locationId`, `hostId`, `minDistance`, `maxDistance`, `fromDate`, `toDate`, `isActive`.

### Referencias

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/references/categories` | Lista categorías activas |
| `GET` | `/references/locations` | Lista ubicaciones activas |
| `GET` | `/references/hosts` | Lista organizadores activos |

Comprobación del estado del backend:

```text
GET http://localhost:3000/health
```

## 🛡️ Validación y gestión de errores

- El backend valida los datos con Zod y Mongoose; los esquemas son `.strict()`.
- La API devuelve errores con una estructura uniforme: `{ error: { code, message, details? } }`.
- El frontend centraliza el tratamiento de errores HTTP, incluidos los de validación, auth, permisos,
  tiempos de espera y respuestas no válidas.
- Los formularios del frontend validan los campos obligatorios.

## 🔧 Configuración

### Backend

Configura las variables necesarias en `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/trail_running
JWT_SECRET=change-me-with-a-long-random-secret
JWT_EXPIRES_IN=1h
APP_URL=http://localhost:4200
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

Los orígenes permitidos para CORS se definen con `CORS_ORIGIN`; se pueden separar varios mediante comas.

### Frontend

La configuración se encuentra en:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

La URL base de la API se define mediante `API_URL`, y el tiempo máximo de espera de las peticiones mediante `requestTimeout`.

## 📦 Scripts disponibles

### Frontend

| Comando | Descripción |
|---|---|
| `npm start` | Inicia Angular en modo desarrollo |
| `npm run build` | Genera la compilación de producción |

La compilación de producción se genera en `dist/trail_running_frontend_v3/`.

### Backend

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia la API en modo desarrollo |
| `npm start` | Inicia la API con Node |
| `npm run seed` | Carga los datos de ejemplo |

No hay tests automatizados; la verificación del frontend es `npm run build` sin errores y la del backend se realiza manualmente contra la API.

## 🤝 Contribuciones

Si quieres contribuir al proyecto:

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio.
3. Realiza los cambios y comprueba que la aplicación compila.
4. Abre un pull request.
