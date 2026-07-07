import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { panicApi } from '@/src/features/panic/api/panicApi';

export const CLAVE_HISTORIAL_PROPIO = ['alertas-panico', 'propias'] as const;

export function useHistorialPropio() {
  return useQuery({
    queryKey: CLAVE_HISTORIAL_PROPIO,
    queryFn: panicApi.historialPropio,
  });
}

export function useAlertasComunidad(comunidadId: number) {
  return useQuery({
    queryKey: ['alertas-panico', 'comunidad', comunidadId],
    queryFn: () => panicApi.porComunidad(comunidadId),
    enabled: Number.isFinite(comunidadId),
    refetchInterval: 15000,
  });
}

export function useEliminarAlerta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertaId: number) => panicApi.eliminar(alertaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_HISTORIAL_PROPIO }),
  });
}

export function useReconocerAlerta(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertaId: number) => panicApi.reconocer(alertaId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['alertas-panico', 'comunidad', comunidadId] }),
  });
}

export function useResolverAlerta(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertaId, notas }: { alertaId: number; notas?: string }) =>
      panicApi.resolver(alertaId, notas),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['alertas-panico', 'comunidad', comunidadId] }),
  });
}

export function useFalsaAlarma(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertaId, notas }: { alertaId: number; notas?: string }) =>
      panicApi.falsaAlarma(alertaId, notas),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['alertas-panico', 'comunidad', comunidadId] }),
  });
}
