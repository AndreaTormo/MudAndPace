# backend_agent_ia

Servidor independiente del asistente virtual de MudAndPace (Groq) y de la API del clima (Open-Meteo). Escucha en el puerto **3001**, separado de la API principal (`backend/`, puerto 3000).

## Arranque

```bash
npm install
npm run dev    # nodemon
npm start      # node app.js
```

Health: `GET http://localhost:3001/health`

## Asistente

- `POST http://localhost:3001/api/v1/agent/chat` (público, rate limit 20 req/15 min)
- Body: `{ "message": "string", "history": [{ "role": "user|assistant", "content": "string" }] }` (`history` opcional, máx. 10)
- Respuesta: `{ "success": true, "message": "...", "data": { "reply": "..." } }`

## Actividades

- Base: `http://localhost:3001/api/v1/agent/activities` (público, rate limit 60 req/15 min por IP)
- `GET /estimate` estima tiempo y calorías sin guardar.
- `POST /`, `GET /`, `GET /stats`, `GET /:id`, `PATCH /:id` y `DELETE /:id`.
- El `userId` va en la query (GET/DELETE) o en el body (POST/PATCH). Los filtros de listado aceptan `eventId`, `status`, `from`, `to`, `page` y `limit`.
- Requiere MongoDB (`MONGODB_URI`) y la dependencia `mongoose`.
- Documentación detallada en `activity.md`.

## Clima

- `GET http://localhost:3001/api/v1/agent/weather` (público, rate limit 60 req/15 min por IP)
- Query: `place` o `lat`+`lon`; opcionales `elevation`, `days` (1-16) y `date` (`YYYY-MM-DD`)
- Respuesta: `{ "success": true, "message": "...", "data": { location, timezone, units, days } }`
- Usa Open-Meteo (sin API key) y caché en memoria de 30 minutos.
- Documentación detallada en `weather.md`.

## Variables de entorno (en `backend_agent_ia/.env`)

- `PORT` (por defecto `3001`)
- `CORS_ORIGIN` (por defecto `http://localhost:4200`)
- `MONGODB_URI` (por defecto `mongodb://localhost:27017/trail_running`)
- `GROQ_API_KEY`
- `GROQ_MODEL` (por defecto `openai/gpt-oss-120b`)

El clima no necesita variables de entorno nuevas. Las actividades necesitan `MONGODB_URI`.
