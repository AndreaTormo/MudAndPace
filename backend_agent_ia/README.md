# backend_agent_ia

Módulo de chatbot para MudAndPace (Groq), integrado en `backend/` de v4.

## Endpoint

- `POST /api/v1/agent/chat` (público, rate limit 20 req/15 min)
- Body: `{ "message": "string", "history": [{ "role": "user|assistant", "content": "string" }] }` (`history` opcional, máx. 10)
- Respuesta: `{ "success": true, "message": "...", "data": { "reply": "..." } }`

## Variables de entorno (en `backend/.env`)

- `GROQ_API_KEY`
- `GROQ_MODEL` (por defecto `openai/gpt-oss-120b`)
