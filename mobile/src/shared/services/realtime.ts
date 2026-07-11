import Echo from 'laravel-echo';
import PusherModule, { type ChannelAuthorizationCallback } from 'pusher-js';

import { REVERB_APP_KEY, REVERB_HOST, REVERB_PORT, SERVER_ROOT_URL } from '@/src/config/env';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { httpClient } from '@/src/shared/api/httpClient';

// El build de pusher-js para React Native solo expone un export nombrado
// "Pusher" (CommonJS puro, sin marca __esModule) — el import por defecto de
// TS no coincide con eso en tiempo de ejecución (Metro/Babel hacen interop
// CJS y devuelven el objeto de exports completo, no la clase). Se soportan
// ambas formas por si el build de destino cambia.
const Pusher =
  (PusherModule as unknown as { Pusher?: typeof PusherModule }).Pusher ?? PusherModule;

let echo: Echo<'reverb'> | null = null;

interface CanalReverb {
  name: string;
}

type DatosAutorizacion = Parameters<ChannelAuthorizationCallback>[1];

/**
 * Cliente WebSocket (Reverb) compartido para toda la app. La autorización de
 * canales privados reutiliza httpClient (ya adjunta el Bearer token vigente
 * vía interceptor), en vez de fijar headers estáticos en la config de Echo.
 */
export function obtenerEcho(): Echo<'reverb'> {
  if (!echo) {
    echo = new Echo<'reverb'>({
      broadcaster: 'reverb',
      key: REVERB_APP_KEY,
      Pusher,
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: false,
      enabledTransports: ['ws'],
      authorizer: (canal: CanalReverb) => ({
        authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
          httpClient
            .post<DatosAutorizacion>(
              '/broadcasting/auth',
              { socket_id: socketId, channel_name: canal.name },
              // /broadcasting/auth vive fuera del prefijo /api de httpClient.
              { baseURL: SERVER_ROOT_URL },
            )
            .then((respuesta) => callback(null, respuesta.data))
            .catch((error: Error) => callback(error, null));
        },
      }),
    });
  }

  return echo;
}

/**
 * Cierra el WebSocket y descarta el singleton. Se invoca automáticamente al
 * cerrar sesión (ver suscripción abajo): los canales privados del usuario
 * anterior quedarían suscritos (y ya autorizados) en la misma conexión si
 * no se desconectara.
 */
export function desconectarEcho(): void {
  echo?.disconnect();
  echo = null;
}

useAuthStore.subscribe((estado, estadoPrevio) => {
  if (estadoPrevio.token && !estado.token) {
    desconectarEcho();
  }
});
