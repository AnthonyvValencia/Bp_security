import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';

const CLAVE_PENDIENTES_APROBACION = ['comunidades-pendientes-aprobacion'] as const;

export function useComunidadesPendientesAprobacion() {
  return useQuery({
    queryKey: CLAVE_PENDIENTES_APROBACION,
    queryFn: comunidadesApi.pendientesAprobacion,
  });
}

export function useAprobarComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (solicitudId: number) => comunidadesApi.aprobarComunidad(solicitudId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES_APROBACION }),
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
