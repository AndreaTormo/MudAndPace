# Pruebas con Postman

## Variables

Crea un Environment en Postman con:

```text
baseUrl = http://localhost:3000
adminToken =
userToken =
eventId =
userId =
imageId =
token =
```

Todas las peticiones JSON deben usar:

```text
Content-Type: application/json
```

Salvo `/health`, `/api/v1/auth/*` y `/uploads`, todas las peticiones requieren:

```text
Authorization: Bearer {{adminToken}}
```

Usa `{{userToken}}` para comprobar el acceso de un usuario normal.

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

## 2. Login

### Admin

**POST** `{{baseUrl}}/api/v1/auth/login`

```json
{
  "email": "admin@mudandpace.com",
  "password": "<TU_PASSWORD>"
}
```

Copia el `data.token` de la respuesta en `adminToken`.

### Usuario normal

**POST** `{{baseUrl}}/api/v1/auth/login`

```json
{
  "email": "user@mudandpace.com",
  "password": "<TU_PASSWORD>"
}
```

Copia el `data.token` en `userToken`.

La respuesta tiene esta forma:

```json
{
  "success": true,
  "message": "Sesión iniciada correctamente",
  "data": {
    "token": "...",
    "expiresAt": "...",
    "user": { "_id": "...", "email": "...", "role": "ADMIN" }
  }
}
```

Guarda `data.user._id` en `userId`.

---

## 3. Registro y verificación

### Registro

**POST** `{{baseUrl}}/api/v1/auth/register`

```json
{
  "name": "Usuario Prueba",
  "email": "prueba@example.com",
  "password": "<TU_PASSWORD>"
}
```

La respuesta es `201` y el usuario queda con `emailVerified: false`.

### Verificación

El token se imprime en la consola de la API. Después:

**POST** `{{baseUrl}}/api/v1/auth/verify-email`

```json
{
  "token": "{{token}}"
}
```

### Reenviar verificación

**POST** `{{baseUrl}}/api/v1/auth/resend-verification`

```json
{
  "email": "prueba@example.com"
}
```

### Olvido de contraseña

**POST** `{{baseUrl}}/api/v1/auth/forgot-password`

```json
{
  "email": "prueba@example.com"
}
```

El enlace/token se imprime en la consola de la API.

### Reset de contraseña

**POST** `{{baseUrl}}/api/v1/auth/reset-password`

```json
{
  "token": "{{token}}",
  "password": "<TU_PASSWORD>"
}
```

---

## 4. Usuarios y perfil

Usa `{{adminToken}}` o `{{userToken}}`. Un `USER` solo puede acceder a su propio `userId`.

### Obtener usuario

**GET** `{{baseUrl}}/api/v1/users/{{userId}}`

### Actualizar usuario

**PATCH** `{{baseUrl}}/api/v1/users/{{userId}}`

```json
{
  "name": "Nombre Actualizado"
}
```

### Obtener perfil

**GET** `{{baseUrl}}/api/v1/users/{{userId}}/profile`

### Actualizar perfil

**PATCH** `{{baseUrl}}/api/v1/users/{{userId}}/profile`

```json
{
  "firstName": "Usuario",
  "lastName": "Prueba",
  "city": "Barcelona",
  "country": "España"
}
```

---

## 5. Eventos

### Listar

**GET** `{{baseUrl}}/api/v1/events`

Con filtros:

```text
{{baseUrl}}/api/v1/events?status=published&categoryId=ID&locationId=ID&minDistance=20&maxDistance=100
```

Filtros disponibles: `status` (`published`, `draft`, `all`), `categoryId`, `locationId`, `hostId`,
`minDistance`, `maxDistance`, `fromDate`, `toDate`, `isActive`.

### Detalle

**GET** `{{baseUrl}}/api/v1/events/{{eventId}}`

**GET** `{{baseUrl}}/api/v1/events/slug/montgo-circular`

### Crear (solo ADMIN)

**POST** `{{baseUrl}}/api/v1/events`

```json
{
  "name": "Evento de prueba 2027",
  "sku": "TEST-2027",
  "description": "Evento creado desde Postman.",
  "hostId": "665a1b2c3d4e5f60718293b5",
  "categoryId": "665a1b2c3d4e5f60718293c6",
  "locationId": "665a1b2c3d4e5f60718293d7",
  "startDate": "2027-06-12T07:00:00.000Z",
  "endDate": "2027-06-12T19:00:00.000Z",
  "distanceKm": 42,
  "elevationGain": 2500,
  "price": 50,
  "status": "draft"
}
```

Guarda el `_id` devuelto en `eventId`.

### Actualizar (solo ADMIN)

**PUT** `{{baseUrl}}/api/v1/events/{{eventId}}`

```json
{
  "name": "Evento de prueba actualizado",
  "distanceKm": 45,
  "elevationGain": 2700
}
```

### Publicar / despublicar (solo ADMIN)

**PATCH** `{{baseUrl}}/api/v1/events/{{eventId}}/publish`

**PATCH** `{{baseUrl}}/api/v1/events/{{eventId}}/unpublish`

### Papelera (solo ADMIN)

**PATCH** `{{baseUrl}}/api/v1/events/{{eventId}}/soft-delete`

o

**DELETE** `{{baseUrl}}/api/v1/events/{{eventId}}`

Listar papelera:

**GET** `{{baseUrl}}/api/v1/events/deleted`

Restaurar:

**PATCH** `{{baseUrl}}/api/v1/events/{{eventId}}/restore`

Eliminar definitivamente:

**DELETE** `{{baseUrl}}/api/v1/events/{{eventId}}/permanent`

### Imágenes (solo ADMIN)

Listar:

**GET** `{{baseUrl}}/api/v1/events/{{eventId}}/images`

Subir (form-data, campo `images`, hasta 8):

**POST** `{{baseUrl}}/api/v1/events/{{eventId}}/images`

Marcar portada:

**PATCH** `{{baseUrl}}/api/v1/events/{{eventId}}/images/{{imageId}}/cover`

Eliminar:

**DELETE** `{{baseUrl}}/api/v1/events/{{eventId}}/images/{{imageId}}`

---

## 6. Referencias

Requieren token.

**GET** `{{baseUrl}}/api/v1/references/categories`

**GET** `{{baseUrl}}/api/v1/references/locations`

**GET** `{{baseUrl}}/api/v1/references/hosts`

---

## 7. Comprobaciones de permisos

- Sin token en `/api/v1/events` → `401 AUTHENTICATION_REQUIRED`.
- `{{userToken}}` en `/api/v1/events/deleted` → `403 FORBIDDEN`.
- `{{userToken}}` en `POST /api/v1/events` → `403 FORBIDDEN`.
- `{{userToken}}` en `/api/v1/users/{{otroUserId}}` → `403 FORBIDDEN`.
- Token manipulado o caducado → `401 INVALID_TOKEN` / `401 TOKEN_EXPIRED`.
- Login de usuario no verificado → `403 EMAIL_NOT_VERIFIED`.
