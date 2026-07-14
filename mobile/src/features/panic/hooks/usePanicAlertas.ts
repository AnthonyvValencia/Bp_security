import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { panicApi } from '@/src/features/panic/api/panicApi';
import {
  CLAVE_ALERTAS_SIN_COMUNIDAD,
  CLAVE_HISTORIAL_PROPIO,
  claveAlertasComunidad,
  upsertAlertaEnCache,
} from '@/src/features/panic/services/alertasCache';
import type { AlertaPanico } from '@/src/features/panic/types';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { obtenerEcho } from '@/src/shared/services/realtime';

export { CLAVE_ALERTAS_SIN_COMUNIDAD, CLAVE_HISTORIAL_PROPIO, claveAlertasComunidad };

/**
 * Suscribe una lista de alertas (identificada por claveConsulta) a un canal
 * privado de Reverb: cada `alerta.actualizada` que llegue actualiza la caché
 * de TanStack Query al instante, sin esperar al próximo polling.
 */
function useSuscripcionAlertas(nombreCanal: string | null, claveConsulta: readonly unknown[]) {
  useEffect(() => {
    if (!nombreCanal) {
      return;
    }

    const canal = obtenerEcho().private(nombreCanal);

    const manejador = (evento: { alerta: AlertaPanico }) => {
      upsertAlertaEnCache(claveConsulta, evento.alerta);
    };

    canal.listen('.alerta.actualizada', manejador);

    return () => {
      // stopListening (no leave/echo.leave): este canal puede tener otros
      // suscriptores simultáneos (ej. "historial" y "mis reportes" comparten
      // el canal personal del usuario) — leave() lo destruiría para todos.
      canal.stopListening('.alerta.actualizada', manejador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- claveConsulta se deriva de nombreCanal, no necesita ir en deps
  }, [nombreCanal]);
}

/**
 * Suscripción global al canal personal del usuario. Debe montarse una sola
 * vez a nivel del layout autenticado, no por pantalla: si viviera dentro de
 * useHistorialPropio, los eventos que lleguen mientras el usuario está en
 * otra pantalla (ej. el home, donde se presiona el botón) se perderían.
 */
export function useAlertasTiempoRealGlobal() {
  const usuario = useAuthStore((state) => state.usuario);

  useSuscripcionAlertas(usuario ? `App.Models.User.${usuario.id}` : null, CLAVE_HISTORIAL_PROPIO);
}

export function useHistorialPropio() {
  return useQuery({
    queryKey: CLAVE_HISTORIAL_PROPIO,
    queryFn: panicApi.historialPropio,
    // Dato crítico: al entrar a la pantalla siempre se refetchea, aunque el
    // tiempo real ya la mantenga al día (red de seguridad si el WS se cayó).
    staleTime: 0,
  });
}

export function useAlertasComunidad(comunidadId: number) {
  const claveConsulta = claveAlertasComunidad(comunidadId);
  const esValido = Number.isFinite(comunidadId) && comunidadId > 0;

  useSuscripcionAlertas(esValido ? `comunidad.${comunidadId}.alertas-panico` : null, claveConsulta);

  return useQuery({
    queryKey: claveConsulta,
    queryFn: () => panicApi.porComunidad(comunidadId),
    enabled: Number.isFinite(comunidadId),
    staleTime: 0,
    // Respaldo por si el WebSocket de Reverb se desconecta; la entrega
    // principal de alertas nuevas/actualizadas es en tiempo real (ver arriba).
    refetchInterval: 30000,
  });
}

/**
 * Cola del admin. Un ciudadano sin comunidad no tiene líder que lo atienda:
 * su alerta solo llega aquí, así que esta pantalla es el único lugar del
 * sistema donde ese pánico es visible.
 */
export function useAlertasSinComunidad() {
  useSuscripcionAlertas('admin.alertas-panico', CLAVE_ALERTAS_SIN_COMUNIDAD);

  return useQuery({
    queryKey: CLAVE_ALERTAS_SIN_COMUNIDAD,
    queryFn: panicApi.sinComunidad,
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useEliminarAlerta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertaId: number) => panicApi.eliminar(alertaId),
    // Optimista: la tarjeta desaparece al instante, sin esperar el DELETE ni
    // el refetch. Si el servidor falla, se restaura la lista anterior.
    onMutate: async (alertaId) => {
      await queryClient.cancelQueries({ queryKey: CLAVE_HISTORIAL_PROPIO });

      const alertasPrevias = queryClient.getQueryData<AlertaPanico[]>(CLAVE_HISTORIAL_PROPIO);

      queryClient.setQueryData<AlertaPanico[]>(CLAVE_HISTORIAL_PROPIO, (actuales) =>
        actuales?.filter((alerta) => alerta.id !== alertaId),
      );

      return { alertasPrevias };
    },
    onError: (_error, _alertaId, contexto) => {
      if (contexto?.alertasPrevias) {
        queryClient.setQueryData(CLAVE_HISTORIAL_PROPIO, contexto.alertasPrevias);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_HISTORIAL_PROPIO }),
  });
}

/**
 * Las tres acciones de cierre reciben la clave de la lista que deben refrescar:
 * las usan tanto el líder sobre la cola de su comunidad como el admin sobre la
 * cola de alertas sin comunidad.
 */
export function useReconocerAlerta(claveConsulta: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertaId: number) => panicApi.reconocer(alertaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveConsulta }),
  });
}

export function useResolverAlerta(claveConsulta: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertaId, notas }: { alertaId: number; notas?: string }) =>
      panicApi.resolver(alertaId, notas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveConsulta }),
  });
}

export function useFalsaAlarma(claveConsulta: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertaId, notas }: { alertaId: number; notas?: string }) =>
      panicApi.falsaAlarma(alertaId, notas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveConsulta }),
  });
}
