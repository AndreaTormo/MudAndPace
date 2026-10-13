# Pruebas con Postman

## Variables

Crea un Environment en Postman con:

```text
baseUrl = http://localhost:3000
routeId =
routeSlug = montgo-circular
```

Todas las peticiones JSON deben usar:

```text
Content-Type: application/json
```

---

## 1. Health check

**GET**

```text
{{baseUrl}}/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "trail-running-api"
}
```

---

## 2. Listar rutas

**GET**

```text
{{baseUrl}}/api/v1/routes
```

### Con filtros

```text
{{baseUrl}}/api/v1/routes?difficulty=hard&minDistance=10&maxDistance=50
```

Por defecto devuelve rutas activas e inactivas (no las borradas con el modelo antiguo). Filtro por estado:

```text
{{baseUrl}}/api/v1/routes?status=active
{{baseUrl}}/api/v1/routes?status=inactive
{{baseUrl}}/api/v1/routes?status=all
```

---

## 3. Obtener por slug

**GET**

```text
{{baseUrl}}/api/v1/routes/slug/{{routeSlug}}
```

---

## 4. Crear ruta

**POST**

```text
{{baseUrl}}/api/v1/routes
```

Body → raw → JSON:

```json
{
  "name": "Aitana Summit Trail",
  "description": "Ruta exigente de alta montaña.",
  "location": {
    "country": "España",
    "region": "Comunitat Valenciana",
    "province": "Alicante",
    "municipality": "Confrides"
  },
  "startPoint": {
    "type": "Point",
    "coordinates": [-0.2717, 38.6556]
  },
  "distanceKm": 21.6,
  "elevationGainM": 1320,
  "elevationLossM": 1320,
  "difficulty": "expert",
  "surface": ["trail", "rock", "dirt"],
  "tags": ["aitana", "summit", "mountain"],
  "isPublished": true
}
```

Después de crearla, copia `_id` a:

```text
routeId
```

---

## 5. Obtener por ID

**GET**

```text
{{baseUrl}}/api/v1/routes/{{routeId}}
```

---

## 6. Actualizar ruta

**PUT**

```text
{{baseUrl}}/api/v1/routes/{{routeId}}
```

Body:

```json
{
  "description": "Ruta actualizada desde Postman.",
  "tags": ["aitana", "summit", "updated"]
}
```

---

## 7. Buscar rutas cercanas

**GET**

```text
{{baseUrl}}/api/v1/routes/nearby?longitude=0.1123&latitude=38.8027&radiusKm=25
```

El radio está expresado en kilómetros.

---

## 8. Eliminar ruta (soft delete)

**DELETE**

```text
{{baseUrl}}/api/v1/routes/{{routeId}}
```

Equivalente: **PATCH** `{{baseUrl}}/api/v1/routes/{{routeId}}/soft-delete`.

Si la ruta está activa pasa a inactiva (`isActive: false`, `status: "inactive"`).
Si ya está inactiva devuelve error 409.

Respuesta esperada:

```json
{
  "data": {
    "_id": "...",
    "isActive": false,
    "status": "inactive"
  }
}
```

---

## 9. Restaurar ruta

**PATCH**

```text
{{baseUrl}}/api/v1/routes/{{routeId}}/restore
```

Solo restaura rutas inactivas (`isActive: true`, `status: "active"`). Si ya está activa devuelve error 409.

---

## 10. Activar / desactivar

**PATCH**

```text
{{baseUrl}}/api/v1/routes/{{routeId}}/activate
{{baseUrl}}/api/v1/routes/{{routeId}}/deactivate
```

Mismas precondiciones que restore/soft-delete: `activate` exige ruta inactiva y `deactivate` exige ruta activa.

---

## Casos de error recomendados

### ID inválido

```text
GET {{baseUrl}}/api/v1/routes/abc
```

Esperado:

```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "ID de ruta inválido"
  }
}
```

### Ruta inexistente

Usa un ObjectId válido que no exista en MongoDB:

```text
GET {{baseUrl}}/api/v1/routes/507f1f77bcf86cd799439011
```

Esperado:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ruta no encontrada"
  }
}
```

### Coordenadas inválidas

```text
GET {{baseUrl}}/api/v1/routes/nearby?longitude=500&latitude=999&radiusKm=-1
```

Esperado:

```json
{
  "error": {
    "code": "INVALID_GEO_QUERY",
    "message": "Coordenadas o radio inválidos"
  }
}
```

### Borrar una ruta ya inactiva

```text
DELETE {{baseUrl}}/api/v1/routes/{{routeId}}
```

(Con la ruta ya en estado inactivo.)

Esperado:

```json
{
  "error": {
    "code": "ROUTE_ALREADY_INACTIVE",
    "message": "La ruta ya está inactiva y no se puede volver a borrar"
  }
}
```

### Restaurar una ruta ya activa

```text
PATCH {{baseUrl}}/api/v1/routes/{{routeId}}/restore
```

(Con la ruta ya en estado activo.)

Esperado:

```json
{
  "error": {
    "code": "ROUTE_ALREADY_ACTIVE",
    "message": "La ruta ya está activa y no se puede restaurar"
  }
}
```

---

## Flujo completo

1. Arranca MongoDB.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Ejecuta `node src/seed.js`.
5. Ejecuta `npm run dev`.
6. Ejecuta el health check.
7. Lista las rutas (prueba también `?status=inactive`).
8. Busca una ruta por slug.
9. Crea una ruta y guarda su `_id` en `routeId`.
10. Actualízala.
11. Prueba la búsqueda geográfica.
12. Elimínala (pasa a inactiva) y vuelve a intentarlo (409).
13. Restaurala y vuelve a intentarlo (409).
