# API de actividades

Los usuarios registran salidas o entrenos con **km, desnivel, tiempo y calorías**. Si no envían el tiempo o las calorías, la API los calcula y lo marca como `estimated`. También hay un endpoint para estimar sin guardar nada.

Escucha en el mismo servidor que el agente (`http://localhost:3001`) y usa MongoDB con Mongoose. Requiere `MONGODB_URI` apuntando a la base de datos (por defecto `mongodb://localhost:27017/trail_running`).

## Endpoints

Prefijo: `/api/v1/agent/activities` (público, rate limit 60 peticiones/15 min por IP).

| Método | Ruta | Para qué |
|--------|------|----------|
| GET | `/estimate` | Estimar tiempo y calorías sin guardar |
| POST | `/` | Crear actividad |
| GET | `/` | Listar (paginado) |
| GET | `/stats` | Totales del usuario |
| GET | `/:id` | Ver una |
| PATCH | `/:id` | Modificar |
| DELETE | `/:id` | Borrar (204) |

El `userId` identifica al usuario: va en la query (GET/DELETE) o en el body (POST/PATCH). Todas las consultas filtran por `userId`.

## Estimar

`GET /api/v1/agent/activities/estimate?distanceKm=42&elevationGainM=2000&weightKg=65&paceMinPerKm=6:00`

| Query | Obligatorio | Descripción |
|-------|-------------|-------------|
| `distanceKm` | sí | 0.1 – 1000 |
| `elevationGainM` | no | Desnivel positivo en metros (0 por defecto) |
| `paceMinPerKm` | no | Ritmo en llano: `6:30` o `6.5` |
| `weightKg` | no | 30 – 250 |

## Crear

`POST /api/v1/agent/activities`

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `userId` | sí | Identificador del usuario |
| `title` | sí | Hasta 120 caracteres |
| `date` | sí | `YYYY-MM-DD` o ISO 8601 |
| `distanceKm` | sí | Km |
| `elevationGainM` | no | Desnivel positivo (m) |
| `duration` o `durationSec` | no | `"1:02:30"`, `"45:10"` o segundos. Si falta, se estima |
| `calories` | no | Si falta, se estiman |
| `status` | no | `completed` (por defecto) o `planned` |
| `eventId` | no | Evento al que pertenece |
| `notes` | no | Hasta 1000 caracteres |
| `paceMinPerKm`, `weightKg` | no | Solo para la estimación (no se guardan) |

## Listar

`GET /api/v1/agent/activities?userId=u1&eventId=ev1&status=completed&from=2026-11-01&to=2026-11-30&page=1&limit=20`

Solo `userId` es obligatorio. Filtros opcionales: `eventId`, `status`, `from`, `to` (`YYYY-MM-DD` incluye el día entero), `page` (1) y `limit` (20, máx. 100). Ordena de más reciente a más antigua.

```json
{
  "success": true,
  "message": "Actividades obtenidas correctamente",
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

## Totales

`GET /api/v1/agent/activities/stats?userId=u1&eventId=ev1` (acepta también `from` y `to`). Cuenta solo las `completed`.

```json
{
  "activities": 2,
  "totalDistanceKm": 30.5,
  "totalElevationGainM": 800,
  "totalDurationSec": 14550,
  "totalDuration": "4:02:30",
  "totalCalories": 2740,
  "avgPaceMinPerKm": "7:57"
}
```

## Modificar

`PATCH /api/v1/agent/activities/:id` con `userId` y los campos a cambiar. Si el tiempo o las calorías eran estimados y cambias `distanceKm`, `elevationGainM`, `paceMinPerKm` o `weightKg`, se recalculan; si el usuario los puso a mano, no se tocan.

## Estimación

- km-esfuerzo = km + desnivel positivo / 100
- Tiempo = km-esfuerzo × ritmo en llano (por defecto 6:30 min/km), con un margen de ±15 % en `/estimate`
- Calorías ≈ peso (kg) × km-esfuerzo (por defecto 70 kg)

Los valores por defecto están en `DEFAULTS` al principio de `services/activity.service.js`.

## Errores

| Código | `error.code` | Motivo |
|--------|--------------|--------|
| 400 | `VALIDATION_ERROR` | Parámetros inválidos, `userId` ausente o PATCH vacío |
| 400 | `INVALID_ID` | Id mal formado |
| 404 | `ACTIVITY_NOT_FOUND` | La actividad no existe o es de otro usuario |
| 429 | `TOO_MANY_REQUESTS` | Límite de peticiones superado |
| 503 | `DATABASE_UNAVAILABLE` | MongoDB no está disponible |
