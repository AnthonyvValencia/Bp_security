# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# BP Security — Mobile (Expo / React Native)

⚠️ Antes de escribir código, verificar la doc versionada real de Expo
instalado (no asumir versión): https://docs.expo.dev/versions/latest/
Confirmar SDK exacto en `app.json` / `package.json` antes de usar cualquier API.

## Stack

- React Native + Expo (Expo Go para desarrollo), TypeScript estricto (NO JavaScript)
- Expo Router, Zustand, TanStack Query
- Expo Notifications (FCM), Expo Location, react-native-maps
- ESLint + Prettier

## Comandos

- `npx expo start`
- `npm run lint`
- `npx tsc --noEmit`

## Arquitectura

- Feature-first (auth/, comunidades/, panico/, chat/...)
- Custom hooks para lógica reutilizable
- Sin lógica de negocio en el frontend — todo vía API (TanStack Query)

## Convenciones

- TypeScript estricto, sin `any` injustificado
- Material Design 3
