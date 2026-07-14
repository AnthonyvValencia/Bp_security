import { queryClient } from '@/src/config/queryClient';
import type { AlertaPanico } from '@/src/features/panic/types';

export const CLAVE_HISTORIAL_PROPIO = ['alertas-panico', 'propias'] as const;

/** Cola del líder: las alertas de su comunidad. */
export const claveAlertasComunidad = (comunidadId: number) =>
  ['alertas-panico', 'comunidad', comunidadId] as const;

/** Cola del admin: las alertas de ciudadanos sin comunidad. */
export const CLAVE_ALERTAS_SIN_COMUNIDAD = ['alertas-panico', 'sin-comunidad'] as const;

/**
 * Inserta o actualiza una alerta en una lista cacheada de TanStack Query.
 * Idempotente por id: la misma alerta puede llegar por varias vías a la vez
 * (respuesta directa del POST, evento de Reverb, refetch) sin duplicarse.
 */
export function upsertAlertaEnCache(clave: readonly unknown[], alerta: AlertaPanico): void {
  queryClient.setQueryData<AlertaPanico[]>(clave, (actuales) => {
    if (!actuales) {
      return [alerta];
    }

    const yaExiste = actuales.some((item) => item.id === alerta.id);

    return yaExiste
      ? actuales.map((item) => (item.id === alerta.id ? alerta : item))
      : [alerta, ...actuales];
  });
}
