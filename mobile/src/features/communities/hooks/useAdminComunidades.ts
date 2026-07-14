import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import { obtenerEcho } from '@/src/shared/services/realtime';

const CLAVE_PENDIENTES_APROBACION = ['comunidades-pendientes-aprobacion'] as const;
const CLAVE_GESTIONABLES = ['comunidades-gestionables'] as const;

export function useComunidadesPendientesAprobacion() {
  const queryClient = useQueryClient();

  // Canal exclusivo de administradores: una nueva solicitud de creación
  // aparece en el panel al instante, sin salir y volver a entrar.
  useEffect(() => {
    const canal = obtenerEcho().private('admin.solicitudes');

    const manejador = () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES_APROBACION });
    };

    canal.listen('.solicitud.recibida', manejador);

    return () => {
      canal.stopListening('.solicitud.recibida', manejador);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: CLAVE_PENDIENTES_APROBACION,
    queryFn: comunidadesApi.pendientesAprobacion,
    // Al entrar a la pantalla siempre se refetchea (red de seguridad si el
    // WebSocket estaba caído mientras llegó la solicitud).
    staleTime: 0,
  });
}

export function useAprobarComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (solicitudId: number) => comunidadesApi.aprobarComunidad(solicitudId),
    onSuccess: () => {
      // Al aprobar, la comunidad sale de "pendientes" y entra a "activas":
      // hay que refrescar ambas listas para que aparezca de inmediato.
      queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES_APROBACION });
      queryClient.invalidateQueries({ queryKey: CLAVE_GESTIONABLES });
    },
  });
}

export function useRechazarComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solicitudId, motivo }: { solicitudId: number; motivo?: string }) =>
      comunidadesApi.rechazarComunidad(solicitudId, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES_APROBACION }),
  });
}

export function useComunidadesGestionables() {
  return useQuery({
    queryKey: CLAVE_GESTIONABLES,
    queryFn: comunidadesApi.gestionables,
    // Al volver a la pantalla siempre se refetchea, para reflejar altas o
    // cambios de estado ocurridos mientras estaba en otra pantalla.
    staleTime: 0,
  });
}

export function useSuspenderComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => comunidadesApi.suspenderComunidad(comunidadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_GESTIONABLES }),
  });
}

export function useReactivarComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => comunidadesApi.reactivarComunidad(comunidadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_GESTIONABLES }),
  });
}

export function useEliminarComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => comunidadesApi.eliminarComunidad(comunidadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_GESTIONABLES }),
  });
}

export function useCambiarLider(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nuevoLiderId: number) => comunidadesApi.cambiarLider(comunidadId, nuevoLiderId),
    onSuccess: () => {
      // Refresca el detalle y la lista de miembros (para que el badge "Líder"
      // y el botón "Expulsar" se reacomoden al nuevo líder) más la lista de
      // gestión del admin.
      void queryClient.invalidateQueries({ queryKey: ['comunidad', comunidadId] });
      void queryClient.invalidateQueries({ queryKey: ['miembros', comunidadId] });
      void queryClient.invalidateQueries({ queryKey: CLAVE_GESTIONABLES });
    },
  });
}
