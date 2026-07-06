# BP Security

Monorepo con dos aplicaciones INDEPENDIENTES y desacopladas:

- `backend/`  → API REST en Laravel 13 (ver backend/CLAUDE.md)
- `mobile/`   → App React Native + Expo (ver mobile/AGENTS.md y mobile/CLAUDE.md)

## Arquitectura general
frontend (Expo) → API REST (Laravel/Sanctum) → PostgreSQL → FCM (solo push)

- Toda la lógica de negocio vive en el backend. El frontend NO debe
  contener reglas de negocio, solo UI, navegación, estado local y consumo de API.
- No usar Firebase Auth/Firestore/Realtime DB. Solo FCM para notificaciones push.
- Solo herramientas gratuitas/open source. Si se necesita algo de pago, preguntar antes.

## Entorno local
- Backend: `php artisan serve` (default `http://localhost:8000`)
- Mobile: `npx expo start` — configurar URL base de la API según dispositivo
- DB: PostgreSQL local (ver backend/CLAUDE.md)

## Roles del sistema
- Administrador General (global)
- Líder de Comunidad (un líder por comunidad, se asigna al aprobar la comunidad)
- Ciudadano (rol por defecto)

## Reglas de trabajo
- No asumir datos que falten; preguntar.
- Explicar decisiones arquitectónicas importantes antes de implementarlas.
- No modificar archivos sin explicar antes qué y por qué.
- Trabajamos por fases; al cerrar cada fase, generar mensaje de commit en Conventional Commits.

## Documentación
Ver /docs para especificación detallada del proyecto (roles, permisos, funcionalidades).