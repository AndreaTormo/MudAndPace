# API del clima

Usa [Open-Meteo](https://open-meteo.com) (gratis, sin API key). Previsión: hoy + 15 días como máximo.

## Endpoint

`GET /api/v1/agent/weather` (público, rate limit 60 peticiones/15 min por IP).

Requiere Node 18+ (`fetch` nativo). No hay dependencias nuevas.

| Query       | Obligatorio       | Descripción                                          |
|-------------|-------------------|------------------------------------------------------|
| `place`     | sí, o `lat`+`lon` | Nombre del lugar (ej. `Chamonix`)                    |
| `lat`, `lon`| sí, o `place`     | Coordenadas                                          |
| `elevation` | no                | Cota en metros (ajusta la temperatura a la altitud)  |
| `days`      | no                | 1-16 (por defecto 7)                                 |
| `date`      | no                | `YYYY-MM-DD`: devuelve solo ese día                  |

## Ejemplos

```text
GET /api/v1/agent/weather?place=Chamonix&days=5
GET /api/v1/agent/weather?lat=45.92&lon=6.87&elevation=2300&date=2026-11-20
```

## Respuesta

```json
{
  "success": true,
  "message": "Previsión meteorológica obtenida correctamente",
  "data": {
    "location": {
      "name": "Chamonix",
      "country": "Francia",
      "region": "Auvernia-Ródano-Alpes",
      "latitude": 45.92,
      "longitude": 6.87,
      "elevation": 1038
    },
    "timezone": "Europe/Paris",
    "units": { "temperature": "°C", "precipitation": "mm", "wind": "km/h" },
    "days": [
      {
        "date": "2026-11-20",
        "code": 61,
        "summary": "Lluvia ligera",
        "tempMax": 8.1,
        "tempMin": 1.4,
        "precipitationMm": 3.2,
        "precipitationProbability": 70,
        "windMaxKmh": 18.5,
        "gustsMaxKmh": 41.0,
        "uvIndexMax": 1.2,
        "sunrise": "2026-11-20T07:41",
        "sunset": "2026-11-20T17:03",
        "alerts": []
      }
    ]
  }
}
```

`alerts` se calcula con umbrales editables en `services/weather.service.js` (`THRESHOLDS`).

## Errores

| Código | `error.code`                | Motivo                                      |
|--------|-----------------------------|---------------------------------------------|
| 400    | `VALIDATION_ERROR`          | Parámetros inválidos                        |
| 400    | `WEATHER_DATE_OUT_OF_RANGE` | Fecha fuera del rango de previsión          |
| 404    | `WEATHER_PLACE_NOT_FOUND`   | Lugar no encontrado                         |
| 429    | `TOO_MANY_REQUESTS`         | Límite de peticiones superado               |
| 502    | `WEATHER_PROVIDER_ERROR`    | Open-Meteo responde con error               |
| 504    | `WEATHER_UNAVAILABLE`       | No se pudo contactar con Open-Meteo         |
