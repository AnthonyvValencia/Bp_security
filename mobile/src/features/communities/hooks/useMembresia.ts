import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import { CLAVE_MI_COMUNIDAD } from '@/src/features/communities/hooks/useComunidades';
import { obtenerEcho } from '@/src/shared/services/realtime';

export function useSolicitudesPendientes(comunidadId: number) {
  const queryClient = useQueryClient();
  const usuarioId = useAuthStore((state) => state.usuario?.id);

  // Las solicitudes de ingreso llegan al canal personal del líder: la
  // lista se refresca al instante cuando un vecino pide unirse.
  useEffect(() => {
    if (!usuarioId) {
      return;
    }

    const canal = obtenerEcho().private(`App.Models.User.${usuarioId}`);

    const manejador = () => {
      void queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes', comunidadId] });
    };

    canal.listen('.solicitud.recibida', manejador);

    return () => {
      canal.stopListening('.solicitud.recibida', manejador);
    };
  }, [usuarioId, comunidadId, queryClient]);

  return useQuery({
    queryKey: ['solicitudes-pendientes', comunidadId],
    queryFn: () => comunidadesApi.solicitudesPendientes(comunidadId),
    enabled: Number.isFinite(comunidadId),
    // Red de seguridad si el WebSocket estaba caído al llegar la solicitud.
    staleTime: 0,
  });
}

export function useAprobarSolicitud(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (solicitudId: number) => comunidadesApi.aprobarSolicitud(solicitudId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes', comunidadId] });
      queryClient.invalidateQueries({ queryKey: ['miembros', comunidadId] });
    },
  });
}

export function useRechazarSolicitud(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solicitudId, motivo }: { solicitudId: number; motivo?: string }) =>
      comunidadesApi.rechazarSolicitud(solicitudId, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-pendientes', comunidadId] });
    },
  });
}

export function useMiembros(comunidadId: number) {
  return useQuery({
    queryKey: ['miembros', comunidadId],
    queryFn: () => comunidadesApi.miembros(comunidadId),
    enabled: Number.isFinite(comunidadId),
  });
}

export function useExpulsarMiembro(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (miembroId: number) => comunidadesApi.expulsarMiembro(comunidadId, miembroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miembros', comunidadId] });
      queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD });
    },
  });
}
