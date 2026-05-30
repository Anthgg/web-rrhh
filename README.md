# FABRYOR Admin Web

Panel web administrativo para FABRYOR construido con Next.js, React, TypeScript y Tailwind CSS.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- React Hook Form + Zod

## Modulos

- Login
- Dashboard
- Solicitudes
- Documentos
- Trabajadores
- Perfil
- Reportes
- Roles y permisos

## Estructura

```text
src/
  app/              Rutas, layouts y route handlers internos
  components/       UI base, layout y bloques reutilizables
  features/         Pantallas y logica de cada modulo
  lib/              Config, auth, cliente backend y normalizadores
  providers/        Query client y sesion
  services/         Servicios front desacoplados por modulo
  types/            Tipos e interfaces compartidas
```

## Variables de entorno

Usa `.env.example` como base.

Variables clave:

- `NEXT_PUBLIC_API_BASE_URL`
- `API_AUTH_LOGIN_PATHS`
- `API_AUTH_PROFILE_PATHS`
- `API_AUTH_LOGIN_PATHS`
- `API_AUTH_PROFILE_PATHS`
- `API_AUTH_REFRESH_PATHS`
- `API_PROFILE_PATHS`
- `API_DASHBOARD_PATHS`
- `API_REQUESTS_PATHS`
- `API_DOCUMENTS_PATHS`
- `API_USERS_PATHS`
- `API_WORKERS_PATHS`
- `API_ROLES_PATHS`
- `API_REPORTS_ATTENDANCE_PATHS`
- `API_REPORTS_MONTHLY_SUMMARY_PATHS`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Integracion con backend

- La sesion web se maneja con cookies `httpOnly`.
- Las paginas consumen rutas internas `/api/*`.
- Los route handlers hacen proxy al backend existente.
- La aplicacion consume solo endpoints administrativos reales; si una ruta falla, no existe o no cumple contrato, la interfaz muestra el error real en lugar de datos simulados.
- Para revisar conectividad despues de iniciar sesion, abre `/api/diagnostics/connections`. Devuelve estado HTTP y ruta usada por modulo, sin exponer tokens ni datos de negocio.
