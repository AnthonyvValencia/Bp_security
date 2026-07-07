import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportesApi } from '@/src/features/reports/api/reportesApi';
import type { CrearReportePayload, EstadoReporte } from '@/src/features/reports/types';

export const CLAVE_REPORTES_PROPIOS = ['reportes', 'propios'] as const;

export function useReportesPropios() {
  return useQuery({
    queryKey: CLAVE_REPORTES_PROPIOS,
    queryFn: reportesApi.propios,
  });
}

export function useReportesComunidad(comunidadId: number) {
  return useQuery({
    queryKey: ['reportes', 'comunidad', comunidadId],
    queryFn: () => reportesApi.porComunidad(comunidadId),
    enabled: Number.isFinite(comunidadId),
    refetchInterval: 15000,
  });
}

export function useReporte(reporteId: number) {
  return useQuery({
    queryKey: ['reporte', reporteId],
    queryFn: () => reportesApi.detalle(reporteId),
    enabled: Number.isFinite(reporteId),
  });
}

export function useCrearReporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearReportePayload) => reportesApi.crear(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_REPORTES_PROPIOS }),
  });
}

export function useEliminarReporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reporteId: number) => reportesApi.eliminar(reporteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_REPORTES_PROPIOS }),
  });
}

export function useCambiarEstadoReporte(comunidadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reporteId,
      estado,
      comentario,
    }: {
      reporteId: number;
      estado: EstadoReporte;
      comentario?: string;
    }) => reportesApi.cambiarEstado(reporteId, estado, comentario),
    onSuccess: (reporte) => {
      queryClient.invalidateQueries({ queryKey: ['reportes', 'comunidad', comunidadId] });
      queryClient.invalidateQueries({ queryKey: ['reporte', reporte.id] });
    },
  });
}
