import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { notificacionesApi } from '@/src/features/notifications/api/notificacionesApi';
import type { ResumenNotificaciones } from '@/src/features/notifications/types';
import { obtenerEcho } from '@/src/shared/services/realtime';

export const CLAVE_RESUMEN_NOTIFICACIONES = ['resumen-notificaciones'] as const;

const RESUMEN_VACIO: ResumenNotificaciones = {
  solicitudes_ingreso: 0,
  alertas_abiertas: 0,
  reportes_abiertos: 0,
  chat_no_leidos: 0,
};

/**
 * Contadores de pendientes del usuario. Los cálculos viven en el backend
 * (quién es líder, qué está sin atender), aquí solo se pintan.
 */
export function useResumenNotificaciones() {
  const hayToken = useAuthStore((state) => Boolean(state.token));

  return useQuery({
    queryKey: CLAVE_RESUMEN_NOTIFICACIONES,
    queryFn: notificacionesApi.resumen,
    enabled: hayToken,
    staleTime: 0,
    // Respaldo por si el WebSocket se cae; la vía principal es el tiempo real.
    refetchInterval: 60_000,
  });
}

/**
 * Mantiene las insignias en vivo. Va montado en el layout (no por pantalla)
 * para que los contadores estén al día esté donde esté el usuario.
 *
 * Escucha los eventos que ya emite el backend:
 * - canal personal: `solicitud.recibida` (a un líder le piden entrar).
 * - canal de la comunidad: alertas, reportes y mensajes de chat.
 */
export function useNotificacionesTiempoReal(comunidadId: number | undefined) {
  const queryClient = useQueryClient();
  const usuarioId = useAuthStore((state) => state.usuario?.id);

  useEffect(() => {
    if (!usuarioId) {
      return;
    }

    const invalidar = () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_RESUMEN_NOTIFICACIONES });
    };

    // Canal personal: por aquí llega la solicitud de ingreso al líder.
    const canalPersonal = obtenerEcho().private(`App.Models.User.${usuarioId}`);
    canalPersonal.listen('.solicitud.recibida', invalidar);

    // Canales de la comunidad (solo si pertenece a una).
    const canalesComunidad = comunidadId
      ? [
          { canal: obtenerEcho().private(`comunidad.${comunidadId}.alertas-panico`), evento: '.alerta.actualizada' },
          { canal: obtenerEcho().private(`comunidad.${comunidadId}.reportes`), evento: '.reporte.actualizado' },
          { canal: obtenerEcho().private(`comunidad.${comunidadId}.chat`), evento: '.mensaje.enviado' },
        ]
      : [];

    canalesComunidad.forEach(({ canal, evento }) => canal.listen(evento, invalidar));

    return () => {
      // stopListening con la referencia exacta: los canales son compartidos
      // con otras pantallas, así que nunca se hace leave().
      canalPersonal.stopListening('.solicitud.recibida', invalidar);
      canalesComunidad.forEach(({ canal, evento }) => canal.stopListening(evento, invalidar));
    };
  }, [usuarioId, comunidadId, queryClient]);
}

/**
 * Pone el chat al día. Se llama al abrir la pantalla del chat, de modo que la
 * insignia de "mensajes nuevos" vuelve a cero al instante.
 */
export function useMarcarChatLeido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => notificacionesApi.marcarChatLeido(comunidadId),
    onSuccess: () => {
      // Optimista: la insignia del chat baja a cero sin esperar el refetch.
      queryClient.setQueryData<ResumenNotificaciones>(
        CLAVE_RESUMEN_NOTIFICACIONES,
        (actual) => ({ ...(actual ?? RESUMEN_VACIO), chat_no_leidos: 0 }),
      );
      void queryClient.invalidateQueries({ queryKey: CLAVE_RESUMEN_NOTIFICACIONES });
    },
  });
}
