# BP Security — Backend (Laravel)

## Stack
- Laravel ^13.8, PHP ^8.3, PostgreSQL, Laravel Sanctum (auth por tokens personales)
- API REST pura (sin Blade, sin vistas — el frontend es Expo)
- Testing: Pest (con `RefreshDatabase` habilitado por defecto en `tests/Pest.php`)

## Entorno
- DB: PostgreSQL (`bp_security`), usuario `bp_security_user` (rol y base ya creados localmente)
- Copiar `.env.example` a `.env`, revisar credenciales de PostgreSQL antes de migrar
- Sanctum ya instalado vía `php artisan install:api` (`routes/api.php` habilitado, `HasApiTokens` en `User`)
- Tokens sin expiración automática (decisión de producto: evitar que el botón de pánico falle por sesión expirada) — revocar en logout, cambio de contraseña o suspensión por admin

## Comandos habituales
- `php artisan serve` — levantar servidor local
- `php artisan migrate` — aplicar migraciones
- `php artisan migrate:fresh --seed` — resetear DB con seeders
- `php artisan test` — correr tests (Pest/PHPUnit)
- `composer install` — dependencias

## Arquitectura de código
- Service Layer para lógica de negocio (no meter lógica en Controllers)
- Repository Pattern para acceso a datos
- Form Requests para validación de entrada
- API Resources para dar forma a las respuestas JSON (nunca exponer modelos directo)
- DTOs cuando el payload cruza capas

## Seguridad (no negociable)
- Autenticación: Sanctum (tokens personales, no sesiones para la app móvil)
- Autorización: Policies/Gates según rol (Administrador / Líder / Ciudadano)
- Validar TODA entrada vía Form Requests
- Nunca construir queries con concatenación de strings (usar Eloquent/Query Builder)
- Registrar eventos sensibles (auditoría): login, cambios de rol, expulsiones, alertas de pánico

## Convenciones
- PSR-12, nombres descriptivos, controladores delgados
- Un commit = un cambio lógico, mensaje en Conventional Commits (`feat:`, `fix:`, `refactor:`...)

## Qué NO hacer
- No usar Firebase Auth/Firestore — todo en PostgreSQL
- No añadir dependencias de pago sin preguntar antes