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

/**
 * Raíz del servidor sin el sufijo /api — la necesita /broadcasting/auth,
 * que Laravel registra fuera del prefijo de la API REST.
 */
export const SERVER_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Host LAN para el servidor de Reverb (WebSockets). Debe apuntar a la misma
 * IP que EXPO_PUBLIC_API_URL cuando se prueba en un dispositivo físico.
 */
export const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost';
export const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080);
export const REVERB_APP_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? '';
