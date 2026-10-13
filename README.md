<div align="center">

<img src="./Mountain1.png" alt="Logo de MudAndPace" width="200">

# MudAndPace

**Descubre rutas, explora la montaña y vive el trail running.**

<br>

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

> El árbol es una representación conceptual de la organización de ambas aplicaciones. Ajusta los nombres de las carpetas raíz a los de tu repositorio si son diferentes.

### Flujo de datos

En el frontend, las páginas interactúan con el store de rutas, que utiliza `TrailRouteService` y `ApiService` para realizar peticiones HTTP mediante `HttpClient`. El backend recibe las peticiones a través de sus rutas y controladores, aplica la lógica de negocio de los servicios y accede a MongoDB mediante los repositorios y modelos de Mongoose.

## ⚙️ Requisitos

- Node.js 18 o superior y npm.
- MongoDB 6 o superior, o Docker.
- Los paquetes del frontend y del backend instalados.

## 🚀 Instalación y ejecución

Los siguientes pasos presuponen que frontend y backend están en carpetas separadas. Sustituye las rutas por las de tu repositorio si fuera necesario.

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

Si utilizas MongoDB local, asegúrate de que está en ejecución. Si el proyecto incluye la configuración de Docker Compose, también puedes iniciar los servicios con:

```bash
docker compose up -d
```

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

Comprobación del estado del backend:

```text
GET http://localhost:3000/health
```

### Ejemplos de consulta

Filtrar rutas por dificultad, país y rango de distancia:

```text
GET /api/v1/routes?difficulty=hard&country=España&minDistance=10&maxDistance=40
```

Buscar rutas cercanas a unas coordenadas:

```text
GET /api/v1/routes/nearby?longitude=0.1123&latitude=38.8027&radiusKm=25
```

La búsqueda geográfica utiliza un índice `2dsphere` de MongoDB sobre el campo `startPoint`.

## 🗺️ Datos de una ruta

Las rutas pueden incluir información como nombre, descripción, localización, punto de inicio, distancia, desnivel, dificultad, superficie, etiquetas e imágenes. También pueden incluir una URL a un archivo GPX.

Ejemplo de objeto de ruta:

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

## 🛡️ Validación y gestión de errores

- El backend valida los datos con Zod y Mongoose.
- La API devuelve errores con una estructura uniforme.
- El frontend centraliza el tratamiento de errores HTTP, incluidos los errores de validación, los tiempos de espera y las respuestas no válidas.
- Los formularios del frontend validan los campos obligatorios y las URL HTTP/HTTPS.

Ejemplo de respuesta de error:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ruta no encontrada"
  }
}
```

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

La URL base de la API se define mediante `API_URL`, y el tiempo máximo de espera de las peticiones mediante `requestTimeout` (en milisegundos).

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

## 🧪 Pruebas

Según la documentación actual del frontend, no hay una suite de tests configurada; la comprobación indicada es ejecutar:

```bash
npm run build
```

Para probar los endpoints del backend, consulta el archivo `postman.md` incluido en el proyecto de la API.

## 🌄 Próximas mejoras

Algunas posibles evoluciones para acercar MudAndPace a una plataforma más completa de experiencias de trail running son:

- Perfiles de usuario y autenticación.
- Guardar rutas favoritas y crear listas personales.
- Incorporar tracks GPX y geometrías completas de las rutas.
- Catálogo de carreras y eventos de trail running.
- Clasificaciones y estadísticas.
- Comentarios y galerías de fotos.
- Estadísticas detalladas de desnivel.
- Paginación, caché y limitación de peticiones.
- Roles de usuario y subida de archivos.

Estas ideas son propuestas de evolución y no forman parte necesariamente de la funcionalidad implementada actualmente.

## 🤝 Contribuciones

Si quieres contribuir al proyecto:

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio.
3. Realiza los cambios y comprueba que la aplicación compila.
4. Abre un pull request con una descripción clara.

## 📄 Licencia

Añade aquí la licencia del proyecto cuando esté definida.
