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

## Análisis de comentarios

Los comentarios siguen viviendo en el backend principal. Este servicio solo genera el resumen y el análisis de sentimiento, y persiste sus propios resultados en `ai_comment_summaries` y `ai_sentiment_analyses` de la misma MongoDB.

- `GET http://localhost:3001/api/v1/agent/comments/:departureId/summary` (público, rate limit 10 req/15 min por IP)
- `GET http://localhost:3001/api/v1/agent/comments/sentiment` (solo ADMIN, rate limit 5 req/15 min por usuario)

Query del sentimiento:

- `scope=global|departure|event` (por defecto `global`)
- `departureId` obligatorio si `scope=departure`
- `eventId` obligatorio si `scope=event`
- `includeDeleted=true` para incluir comentarios borrados (por defecto `false`)

Ambos endpoints devuelven `{ "success": true, "message": "...", "data": { ... } }`. Sin comentarios, devuelven `state: "no_data"` y no llaman a Groq. El sentimiento incluye distribución, puntuación 0-100, temas, evolución mensual y rankings con mínimo 5 comentarios.

El frontend accede a través del gateway: `GET /api/v1/agent/comments/...`. La cookie de ADMIN (`mp_access_token` por defecto) llega al servicio IA y se valida contra `JWT_SECRET`, la colección `sessions` y el rol del usuario.

## Variables de entorno (en `backend_agent_ia/.env`)

- `PORT` (por defecto `3001`)
- `CORS_ORIGIN` (por defecto `http://localhost:4200`)
- `MONGODB_URI` (por defecto `mongodb://localhost:27017/trail_running`)
- `GROQ_API_KEY`
- `GROQ_MODEL` (por defecto `openai/gpt-oss-120b`)
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `AUTH_COOKIE_NAME` (para validar el acceso ADMIN al sentimiento)

El clima no necesita variables de entorno nuevas. Las actividades y el análisis de comentarios necesitan `MONGODB_URI`. El análisis de sentimiento necesita además `JWT_SECRET` igual que en el backend principal. Si no están definidas en `backend_agent_ia/.env`, el servicio las toma de `backend/.env` al arrancar (sin sobrescribir las propias).

## Tests

```bash
npm test
```
