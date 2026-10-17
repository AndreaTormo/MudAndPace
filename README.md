<div align="center">

<img src="./Mountain1.png" alt="Logo de MudAndPace" width="200">

<br>
<br>

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-E0A526?style=for-the-badge&logo=github&logoColor=white)
![Trail Running](https://img.shields.io/badge/Trail%20Running-8B5A2B?style=for-the-badge&logo=strava&logoColor=white)
![Montaña](https://img.shields.io/badge/Monta%C3%B1a-4A6741?style=for-the-badge&logo=mountdotcom&logoColor=white)
![Rutas](https://img.shields.io/badge/Rutas-C2793A?style=for-the-badge&logo=googlemaps&logoColor=white)

</div>

---

MudAndPace es una plataforma web centrada en el mundo del trail running, concebida para explorar experiencias de montaña y acercar a los corredores a la emoción de las carreras de trail, inspiradas en circuitos como UTMB World Series y Golden Trail World Series (GTWS).

El proyecto está desarrollado con **Angular** para el frontend y una **API REST con Node.js, Express y MongoDB** para el backend. Actualmente, la aplicación permite consultar y administrar rutas de trail running, con filtros, fichas de detalle y herramientas para crear, editar y gestionar rutas.

## ✨ Funcionalidades

### Frontend
- Listado de rutas con filtros por dificultad, país, región, distancia y estado de publicación.
- Búsqueda de rutas por su identificador.
- Páginas de detalle para consultar la información de una ruta.
- Formularios para crear y editar rutas con validaciones en el cliente.
- Gestión de rutas mediante borrado lógico y recuperación.
- Sección de eventos con listado, filtros, detalle, creación y edición.
- Gestión de eventos: publicar/despublicar y borrado lógico con recuperación.
- Papelera de rutas y eventos con restauración y eliminación definitiva.
- Panel de administración en el sidebar con acceso a las papeleras.
- Estados de carga, errores y resultados vacíos.
- Manejo centralizado de errores y mensajes en español.
- Gestión del estado con Angular Signals y componentes con `OnPush`.

### Backend
- API REST para consultar y administrar rutas de trail running.
- Búsqueda por identificador y por `slug`.
- Filtrado por dificultad, país, región, distancia, publicación y estado.
- Búsqueda geográfica de rutas cercanas mediante coordenadas y radio.
- Creación y actualización de rutas.
- Desactivación lógica, restauración, activación y desactivación de rutas.
- API REST para eventos: listado con filtros, detalle, creación, edición, publicación y borrado lógico.
- Papelera de rutas y eventos: restauración y eliminación definitiva.
- Control de acceso a funciones administrativas mediante guard de UI.
- Modelos de organizador, categoría y ubicación con población de datos relacionados.
- Validación de datos con Zod y esquemas de Mongoose.
- Gestión centralizada de errores y respuestas uniformes.
- Middleware de seguridad, CORS, logging y gestión de rutas no encontradas.

## 🧰 Tecnologías

| Área | Tecnologías |
|---|---|
| Frontend | Angular 18, TypeScript, HTML, CSS |
| Estado y formularios | Angular Signals, Reactive Forms |
| Estilos e interfaz | Tailwind CSS, SweetAlert2 |
| Backend | Node.js, Express |
| Base de datos | MongoDB, Mongoose |
| Validación | Zod |
| Middleware y utilidades | Helmet, Morgan |
| Comunicación | API REST sobre HTTP |

## 🏗️ Arquitectura

MudAndPace está dividido en dos aplicaciones: frontend y backend.

```text
MudAndPace/
├── backend/
│   └── trail-running-api/
│       └── src/
│           ├── config/          # Configuración de base de datos
│           ├── controllers/     # Controladores HTTP
│           ├── middlewares/     # CORS, logging y gestión de errores
│           ├── models/          # Modelos de Mongoose
│           ├── repositories/    # Acceso a datos
│           ├── routes/          # Endpoints de la API
│           ├── services/        # Lógica de negocio y errores
│           ├── app.js
│           └── seed.js          # Datos de ejemplo
└── frontend/
    └── src/
        ├── environments/        # Configuración por entorno
        └── app/
            ├── core/
            │   ├── interceptors/
            │   ├── models/
            │   ├── services/
            │   └── stores/
            ├── features/routes/
            │   ├── components/
            │   └── pages/
            ├── layouts/
            └── shared/
```

### Flujo de datos

En el frontend, las páginas interactúan con el store de rutas, que utiliza `TrailRouteService` y `ApiService` para realizar peticiones HTTP mediante `HttpClient`. El backend recibe las peticiones a través de sus rutas y controladores, aplica la lógica de negocio de los servicios y accede a MongoDB mediante los repositorios y modelos de Mongoose.

## ⚙️ Requisitos

- Node.js 18 o superior y npm.
- MongoDB 6 o superior, o Docker.
- Los paquetes del frontend y del backend instalados.

## 🚀 Instalación y ejecución

### 1. Backend

Entra en la carpeta del backend e instala las dependencias:

```bash
cd backend/trail-running-api
npm install
```

Crea el archivo de variables de entorno a partir del ejemplo disponible:

```bash
cp .env.example .env
```

Revisa `.env` y configura la conexión a MongoDB y los orígenes CORS permitidos.

Arranca la API en modo desarrollo:

```bash
npm run dev
```

La API estará disponible, según la configuración incluida, en `http://localhost:3000`.

### 2. Datos de ejemplo (opcional)

Para cargar las rutas de ejemplo:

```bash
node src/seed.js
```

### 3. Frontend

Abre otra terminal y entra en la carpeta del frontend:

```bash
cd frontend
npm install
npm start
```

Angular arrancará el servidor de desarrollo en:

```text
http://localhost:4200/
```

El frontend utiliza por defecto la API configurada en `src/environments/environment.development.ts`, con la URL base `http://localhost:3000/api/v1`.

## 🔌 API REST

URL base de las rutas:

```text
http://localhost:3000/api/v1/routes
```

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Lista rutas y aplica filtros |
| `GET` | `/:id` | Obtiene una ruta por ID |
| `GET` | `/slug/:slug` | Obtiene una ruta por slug |
| `GET` | `/nearby` | Busca rutas cercanas por ubicación |
| `POST` | `/` | Crea una ruta |
| `PUT` | `/:id` | Actualiza una ruta |
| `PATCH` | `/:id/soft-delete` | Desactiva una ruta mediante borrado lógico |
| `PATCH` | `/:id/restore` | Restaura una ruta inactiva |
| `PATCH` | `/:id/activate` | Activa una ruta inactiva |
| `PATCH` | `/:id/deactivate` | Desactiva una ruta activa |
| `DELETE` | `/:id` | Desactiva una ruta mediante borrado lógico |

### Eventos

Base URL: `http://localhost:3000/api/v1/events`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Lista eventos y aplica filtros |
| `GET` | `/:id` | Obtiene un evento por ID |
| `GET` | `/slug/:slug` | Obtiene un evento por slug |
| `POST` | `/` | Crea un evento |
| `PUT` | `/:id` | Actualiza un evento |
| `PATCH` | `/:id/publish` | Publica un evento (borrador → publicado) |
| `PATCH` | `/:id/unpublish` | Pasa un evento a borrador |
| `PATCH` | `/:id/soft-delete` | Desactiva un evento (borrado lógico) |
| `PATCH` | `/:id/restore` | Restaura un evento inactivo |
| `DELETE` | `/:id` | Desactiva un evento (borrado lógico) |

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

- El backend valida los datos con Zod y Mongoose.
- La API devuelve errores con una estructura uniforme.
- El frontend centraliza el tratamiento de errores HTTP, incluidos los errores de validación, los tiempos de espera y las respuestas no válidas.
- Los formularios del frontend validan los campos obligatorios y las URL HTTP/HTTPS.

## 🔧 Configuración

### Backend

Configura las variables necesarias en el archivo `.env`. Los orígenes permitidos para CORS se definen con `CORS_ORIGIN`; se pueden separar varios orígenes mediante comas. Por ejemplo:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

Ajusta el valor a los puertos y dominios que utilices en tu entorno.

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

La compilación de producción se genera en `dist/trail_running_frontend_v3/`, según la configuración actual del proyecto.

### Backend

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia la API en modo desarrollo |

Consulta los `package.json` de cada aplicación para conocer otros scripts disponibles.

## 🤝 Contribuciones

Si quieres contribuir al proyecto:

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio.
3. Realiza los cambios y comprueba que la aplicación compila.
4. Abre un pull request.