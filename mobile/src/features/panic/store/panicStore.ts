import NetInfo from '@react-native-community/netinfo';
import { isAxiosError } from 'axios';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { panicApi } from '@/src/features/panic/api/panicApi';
import {
  CLAVE_HISTORIAL_PROPIO,
  upsertAlertaEnCache,
} from '@/src/features/panic/services/alertasCache';
import { offlineQueue, type AlertaLocal } from '@/src/features/panic/services/offlineQueue';
import type { EstadoAlerta } from '@/src/features/panic/types';

export type EstadoSincronizacion = 'pendiente' | 'enviando' | 'error';

export interface AlertaEnCola extends AlertaLocal {
  estadoSync: EstadoSincronizacion;
  /**
   * true solo si el error fue de red real (sin respuesta del servidor);
   * false si el servidor respondió y rechazó la petición (ej. límite de
   * alertas por minuto) — en ese caso "sin conexión" sería engañoso.
   */
  sinRed?: boolean;
}

interface Ubicacion {
  latitud: number | null;
  longitud: number | null;
}

export interface AlertaEnCurso extends Ubicacion {
  idCliente: string;
  /** null hasta que la cola offline logre sincronizarla con el servidor. */
  alertaId: number | null;
  /** null mientras siga solo local (todavía no confirmada por el servidor). */
  estado: EstadoAlerta | null;
}

interface PanicState {
  cola: AlertaEnCola[];
  alertaEnCurso: AlertaEnCurso | null;
  sincronizando: boolean;
  hidratar: () => Promise<void>;
  activar: (ubicacion: Ubicacion) => Promise<void>;
  sincronizarPendientes: () => Promise<void>;
  cancelarEnCurso: () => Promise<void>;
  descartarAlertaEnCurso: () => void;
}

// Si llega una alerta nueva mientras ya hay una pasada de sincronización en
// curso (activar() la dispara en cada pulsación), esa pasada solo procesó la
// foto de pendientes que tomó al empezar — la nueva quedaría esperando hasta
// el próximo disparador (cambio de red o el barrido de 20s). Esta bandera
// hace que, en vez de eso, se dispare una pasada más apenas termine la actual.
let reintentarAlTerminar = false;

export const usePanicStore = create<PanicState>((set, get) => ({
  cola: [],
  alertaEnCurso: null,
  sincronizando: false,

  hidratar: async () => {
    const pendientes = await offlineQueue.listarPendientes();

    set({
      cola: pendientes.map((alerta) => ({
        ...alerta,
        estadoSync: alerta.estado === 'error' ? 'error' : 'pendiente',
      })),
    });
  },

  activar: async ({ latitud, longitud }) => {
    const alertaLocal: AlertaLocal = {
      id_cliente: Crypto.randomUUID(),
      latitud,
      longitud,
      creada_en: new Date().toISOString(),
      estado: 'pendiente',
    };

    await offlineQueue.encolar(alertaLocal);

    set((estado) => ({
      cola: [...estado.cola, { ...alertaLocal, estadoSync: 'pendiente' }],
      // La ubicación viaja en la alerta en curso porque el panel la usa para
      // el enlace del mapa que se manda a los contactos de emergencia.
      alertaEnCurso: {
        idCliente: alertaLocal.id_cliente,
        alertaId: null,
        estado: null,
        latitud,
        longitud,
      },
    }));

    // Si ya hay una pasada en curso, marca que hay nuevas alertas esperando.
    // Se dispararán apenas termine la actual (ver below en el finally).
    if (get().sincronizando) {
      reintentarAlTerminar = true;
    } else {
      void get().sincronizarPendientes();
    }
  },

  sincronizarPendientes: async () => {
    if (get().sincronizando) {
      return;
    }

    set({ sincronizando: true });

    try {
      const pendientes = await offlineQueue.listarPendientes();

      for (const alerta of pendientes) {
        set((estado) => ({
          cola: estado.cola.map((item) =>
            item.id_cliente === alerta.id_cliente ? { ...item, estadoSync: 'enviando' } : item,
          ),
        }));

        try {
          const respuesta = await panicApi.activar({
            id_cliente: alerta.id_cliente,
            latitud: alerta.latitud,
            longitud: alerta.longitud,
            creada_en: alerta.creada_en,
          });

          await offlineQueue.eliminar(alerta.id_cliente);

          // Refleja la alerta confirmada en el historial al instante, sin
          // esperar al evento de Reverb ni a un refetch (vía más directa).
          upsertAlertaEnCache(CLAVE_HISTORIAL_PROPIO, respuesta);

          set((estado) => ({
            cola: estado.cola.filter((item) => item.id_cliente !== alerta.id_cliente),
            alertaEnCurso:
              estado.alertaEnCurso?.idCliente === alerta.id_cliente
                ? {
                    ...estado.alertaEnCurso,
                    alertaId: respuesta.id,
                    estado: respuesta.estado,
                  }
                : estado.alertaEnCurso,
          }));
        } catch (error) {
          await offlineQueue.marcarError(alerta.id_cliente);

          // Sin response = no llegó al servidor (red real). Con response
          // (ej. 429 por el límite de alertas/minuto) el servidor sí está
          // disponible, solo rechazó esta petición puntual.
          const sinRed = !(isAxiosError(error) && error.response);

          set((estado) => ({
            cola: estado.cola.map((item) =>
              item.id_cliente === alerta.id_cliente
                ? { ...item, estadoSync: 'error', sinRed }
                : item,
            ),
          }));
        }
      }
    } finally {
      set({ sincronizando: false });

      // Si llegaron alertas nuevas mientras estábamos sincronizando, dispara
      // una pasada más para procesarlas. Sin esto, una alerta que llegue justo
      // al final de la pasada anterior quedaría esperando hasta el próximo
      // cambio de red o el barrido de 20s.
      if (reintentarAlTerminar) {
        reintentarAlTerminar = false;
        void get().sincronizarPendientes();
      }
    }
  },

  cancelarEnCurso: async () => {
    const actual = get().alertaEnCurso;

    if (!actual) {
      return;
    }

    if (actual.alertaId === null) {
      await offlineQueue.eliminar(actual.idCliente);

      set((estado) => ({
        cola: estado.cola.filter((item) => item.id_cliente !== actual.idCliente),
        alertaEnCurso: null,
      }));

      return;
    }

    const alertaCancelada = await panicApi.cancelar(actual.alertaId);

    upsertAlertaEnCache(CLAVE_HISTORIAL_PROPIO, alertaCancelada);

    set({ alertaEnCurso: null });
  },

  descartarAlertaEnCurso: () => set({ alertaEnCurso: null }),
}));

NetInfo.addEventListener((estadoRed) => {
  if (estadoRed.isConnected) {
    void usePanicStore.getState().sincronizarPendientes();
  }
});

// Respaldo además del listener de red: un rechazo del servidor (ej. límite
// de alertas por minuto) no dispara un cambio de conectividad, así que sin
// esto una alerta en cola quedaría esperando indefinidamente.
setInterval(() => {
  if (usePanicStore.getState().cola.length > 0) {
    void usePanicStore.getState().sincronizarPendientes();
  }
}, 20000);
