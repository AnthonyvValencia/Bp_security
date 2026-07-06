import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import { CLAVE_MI_COMUNIDAD } from '@/src/features/communities/hooks/useComunidades';

export function useSolicitudesPendientes(comunidadId: number) {
  return useQuery({
    queryKey: ['solicitudes-pendientes', comunidadId],
    queryFn: () => comunidadesApi.solicitudesPendientes(comunidadId),
    enabled: Number.isFinite(comunidadId),
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
