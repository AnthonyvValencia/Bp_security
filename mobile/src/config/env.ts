import { Platform } from 'react-native';

/**
 * Emulador Android -> 10.0.2.2, iOS/dispositivo físico -> configurar
 * EXPO_PUBLIC_API_URL en un .env.local con la IP LAN de tu máquina
 * (ver mobile/CLAUDE.md).
 */
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  return `http://${host}:8000/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
