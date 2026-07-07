import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { panicApi } from '@/src/features/panic/api/panicApi';
import { offlineQueue, type AlertaLocal } from '@/src/features/panic/services/offlineQueue';
import type { EstadoAlerta } from '@/src/features/panic/types';

export type EstadoSincronizacion = 'pendiente' | 'enviando' | 'error';

export interface AlertaEnCola extends AlertaLocal {
  estadoSync: EstadoSincronizacion;
}

export interface AlertaEnCurso {
  idCliente: string;
  /** null hasta que la cola offline logre sincronizarla con el servidor. */
  alertaId: number | null;
  /** null mientras siga solo local (todavía no confirmada por el servidor). */
  estado: EstadoAlerta | null;
}

interface Ubicacion {
  latitud: number | null;
  longitud: number | null;
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
      alertaEnCurso: { idCliente: alertaLocal.id_cliente, alertaId: null, estado: null },
    }));

    void get().sincronizarPendientes();
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

          set((estado) => ({
            cola: estado.cola.filter((item) => item.id_cliente !== alerta.id_cliente),
            alertaEnCurso:
              estado.alertaEnCurso?.idCliente === alerta.id_cliente
                ? { idCliente: alerta.id_cliente, alertaId: respuesta.id, estado: respuesta.estado }
                : estado.alertaEnCurso,
          }));
        } catch {
          await offlineQueue.marcarError(alerta.id_cliente);

          set((estado) => ({
            cola: estado.cola.map((item) =>
              item.id_cliente === alerta.id_cliente ? { ...item, estadoSync: 'error' } : item,
            ),
          }));
        }
      }
    } finally {
      set({ sincronizando: false });
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

    await panicApi.cancelar(actual.alertaId);

    set({ alertaEnCurso: null });
  },

  descartarAlertaEnCurso: () => set({ alertaEnCurso: null }),
}));

NetInfo.addEventListener((estadoRed) => {
  if (estadoRed.isConnected) {
    void usePanicStore.getState().sincronizarPendientes();
  }
});
