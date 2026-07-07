import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import type { SolicitarCrearComunidadPayload } from '@/src/features/communities/types';

export const CLAVE_MI_COMUNIDAD = ['mi-comunidad'] as const;

export function useBuscarComunidades(termino?: string) {
  return useQuery({
    queryKey: ['comunidades', termino ?? ''],
    queryFn: () => comunidadesApi.buscar(termino),
  });
}

export function useComunidad(id: number) {
  return useQuery({
    queryKey: ['comunidad', id],
    queryFn: () => comunidadesApi.detalle(id),
    enabled: Number.isFinite(id),
  });
}

export function useMiComunidad() {
  return useQuery({
    queryKey: CLAVE_MI_COMUNIDAD,
    queryFn: comunidadesApi.miComunidad,
  });
}

export function useSolicitarCreacionComunidad() {
  return useMutation({
    mutationFn: (payload: SolicitarCrearComunidadPayload) =>
      comunidadesApi.solicitarCreacion(payload),
  });
}

export function useSolicitarIngreso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => comunidadesApi.solicitarIngreso(comunidadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD }),
  });
}

export function useMuroComunidad(comunidadId: number) {
  return useQuery({
    queryKey: ['comunidad', comunidadId, 'muro'],
    queryFn: () => comunidadesApi.muro(comunidadId),
    enabled: Number.isFinite(comunidadId) && comunidadId > 0,
    refetchInterval: 15000,
  });
}
