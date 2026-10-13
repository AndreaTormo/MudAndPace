# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- v3: API (`trail-running-api_v3`) + frontend `trail_running_frontend_v3`; `ng build` limpio (2026-10-07).
- Ronda 2 completada (2026-10-07): OnPush en los 15 componentes, 9 operaciones a async/await +
  firstValueFrom + try/catch, `extractData` en el service, interceptor con `details` de Zod,
  clave `API_URL`, README del frontend en español.
- Auditoría del enunciado (Experiences→Rutas) completada: store, interceptores, lazy, forms y UI ya cumplían.
- Frontend: Angular 18 + Tailwind 3 + SweetAlert2 + ngx-skeleton-loader; sin specs (verificación = build).
- CORS del `.env` de la API ya incluye `http://localhost:4200`.
## Decisiones (y por qué)
- Borrar = `isActive:false, status:'inactive'`, `deleted_at` no se toca; restaurar solo desde inactiva.
- Errores 409 `ROUTE_ALREADY_INACTIVE`/`ROUTE_ALREADY_ACTIVE`; enum `status` sigue `active|inactive`;
  Publicada/Borrador va por `isPublished` con color propio.
- URLs del frontend por `_id` (`/routes/:id`), no por slug: elección explícita del usuario pese al enunciado.
- Tailwind 3.4, no 4: Angular 18 solo admite `tailwindcss ^2||^3`; `tailwind.config.js` + directivas `@tailwind`.
- `standalone: true` explícito en cada componente (Angular 18 no lo asume; el modelo v20 de referencia sí).
- Filtro de publicación en cliente: `z.coerce.boolean` convierte `"false"`→`true`, no se manda `?isPublished=false`.
- Formularios con `fb.nonNullable.group` para que `getRawValue()` no devuelva `string | null`.
- Arquitectura copiada del modelo de `Yomogan\...\1_CRUD\frontend`: ficheros sin sufijo (`.component`),
  store tonto en `core/stores`, páginas orquestan, plantillas inline.
- Enunciado "Experiences": se resuelve con dominio propio → store se llama `TrailRoutesStore` con
  señal `selectedRoute` (no `selectedExperience`); `effect()` en el store sincroniza `selectedRoute`
  con `routes` tras cada refetch; borrar/recuperar sigue con refetch (decisión: simpleza/consistencia).
- Detalle y edición reutilizan `selectedRoute` si el id coincide y no está `stale` (sin GET duplicado).
- Card mantiene distancia/desnivel/dificultad: no hay precio ni duración en el dominio de rutas.
- Navbar con menú hamburguesa (signal local, aria-expanded) y validador `pattern` en la búsqueda por ID.
## Aprendizajes y errores a evitar
- Colisión de nombres: interfaz `RouteFilters` vs componente homónimo → en `route-list` se importa
  el componente alias `RouteFiltersComponent`.
- `type="url"` en un input NO valida nada al enviar: hace falta `urlValidator` propio (new URL + http/https).
- `snapshot.paramMap` en `ngOnInit` no reacciona a cambios de `:id` en la misma ruta → suscribir `paramMap`.
- Los repos devuelven `null` tanto si no existe como si no cumple: el service hace un segundo
  `findById(includeDeleted)` para distinguir 404 de 409.
- `route-card` no inyecta el store: emite `restored` y la página llama a `store.restore()`.
- Los "caracteres corruptos" de la API (`invǭlidos`, `ya est�`) eran artefacto de la consola
  PowerShell: los bytes son UTF-8 correcto. No tocar la API por el display.
- `tsc` de TS ≥6 exige `rootDir` explícito (`TS5011`) al emitir: `tsconfig.json` lleva
  `"rootDir": "./src"`. `ng build` (TS 5.5.4) no lo pide; `npx tsc` descarga la 7.x.
- Errores HTTP → interceptor/estado (sin toast extra en el catch); solo los no-HTTP
  (payload inválido, timeout) → `showUnexpectedError` de `shared/utils/error.util.ts`.
## Próximos pasos
- Smoke test manual con API+Mongo en marcha (lista, filtros, crear, editar, borrar, restaurar, buscador).
- Filas legacy con `status:'deleted'`/`deleted_at` rellenos: migrarlas o limpiar el enum del modelo.
