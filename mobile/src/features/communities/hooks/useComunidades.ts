import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import type { SolicitarCrearComunidadPayload } from '@/src/features/communities/types';
import { obtenerEcho } from '@/src/shared/services/realtime';

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
  const queryClient = useQueryClient();
  const clave = ['comunidad', comunidadId, 'muro'] as const;
  const esValido = Number.isFinite(comunidadId) && comunidadId > 0;

  useEffect(() => {
    if (!esValido) {
      return;
    }

    // El muro es un feed combinado (alertas + reportes) que el servidor
    // arma y ordena. Ante un evento de cualquiera de los dos canales,
    // refrescamos la consulta para traer el muro reordenado al instante.
    const canalReportes = obtenerEcho().private(`comunidad.${comunidadId}.reportes`);
    const canalAlertas = obtenerEcho().private(`comunidad.${comunidadId}.alertas-panico`);

    const refrescar = () => {
      void queryClient.invalidateQueries({ queryKey: clave });
    };

    canalReportes.listen('.reporte.actualizado', refrescar);
    canalAlertas.listen('.alerta.actualizada', refrescar);

    return () => {
      canalReportes.stopListening('.reporte.actualizado', refrescar);
      canalAlertas.stopListening('.alerta.actualizada', refrescar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clave se deriva de comunidadId
  }, [comunidadId, esValido, queryClient]);

  return useQuery({
    queryKey: clave,
    queryFn: () => comunidadesApi.muro(comunidadId),
    enabled: esValido,
    staleTime: 0,
    // Respaldo por si el WebSocket se desconecta.
    refetchInterval: 30000,
  });
}
