import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { reportesApi } from '@/src/features/reports/api/reportesApi';
import type { CrearReportePayload, EstadoReporte, Reporte } from '@/src/features/reports/types';
import { obtenerEcho } from '@/src/shared/services/realtime';

export const CLAVE_REPORTES_PROPIOS = ['reportes', 'propios'] as const;

export function useReportesPropios() {
  return useQuery({
    queryKey: CLAVE_REPORTES_PROPIOS,
    queryFn: reportesApi.propios,
  });
}

export function useReportesComunidad(comunidadId: number) {
  const queryClient = useQueryClient();
  const clave = ['reportes', 'comunidad', comunidadId] as const;
  const esValido = Number.isFinite(comunidadId) && comunidadId > 0;

  useEffect(() => {
    if (!esValido) {
      return;
    }

    const nombreCanal = `comunidad.${comunidadId}.reportes`;
    const canal = obtenerEcho().private(nombreCanal);

    const manejador = (evento: { reporte: Reporte }) => {
      queryClient.setQueryData<Reporte[]>(clave, (actuales) => {
        if (!actuales) {
          return [evento.reporte];
        }

        const yaExiste = actuales.some((item) => item.id === evento.reporte.id);

        return yaExiste
          ? actuales.map((item) => (item.id === evento.reporte.id ? evento.reporte : item))
          : [evento.reporte, ...actuales];
      });
    };

    canal.listen('.reporte.actualizado', manejador);

    return () => {
      canal.stopListening('.reporte.actualizado', manejador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clave se deriva de comunidadId
  }, [comunidadId, esValido, queryClient]);

  return useQuery({
    queryKey: clave,
    queryFn: () => reportesApi.porComunidad(comunidadId),
    enabled: Number.isFinite(comunidadId),
    staleTime: 0,
    // Respaldo por si el WebSocket se desconecta; la entrega principal es en
    // tiempo real (ver arriba).
    refetchInterval: 30000,
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
    // Optimista: la tarjeta desaparece al instante, sin esperar el DELETE ni
    // el refetch. Si el servidor falla, se restaura la lista anterior.
    onMutate: async (reporteId) => {
      await queryClient.cancelQueries({ queryKey: CLAVE_REPORTES_PROPIOS });

      const reportesPrevios = queryClient.getQueryData<Reporte[]>(CLAVE_REPORTES_PROPIOS);

      queryClient.setQueryData<Reporte[]>(CLAVE_REPORTES_PROPIOS, (actuales) =>
        actuales?.filter((reporte) => reporte.id !== reporteId),
      );

      return { reportesPrevios };
    },
    onError: (_error, _reporteId, contexto) => {
      if (contexto?.reportesPrevios) {
        queryClient.setQueryData(CLAVE_REPORTES_PROPIOS, contexto.reportesPrevios);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_REPORTES_PROPIOS }),
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
