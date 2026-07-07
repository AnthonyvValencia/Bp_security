import { httpClient } from '@/src/shared/api/httpClient';

import type { CrearReportePayload, EstadoReporte, Reporte } from '@/src/features/reports/types';

export const reportesApi = {
  crear: async (payload: CrearReportePayload): Promise<Reporte> => {
    const { data } = await httpClient.post<{ reporte: Reporte }>('/reportes', payload);

    return data.reporte;
  },

  propios: async (): Promise<Reporte[]> => {
    const { data } = await httpClient.get<{ reportes: Reporte[] }>('/reportes');

    return data.reportes;
  },

  porComunidad: async (comunidadId: number): Promise<Reporte[]> => {
    const { data } = await httpClient.get<{ reportes: Reporte[] }>(
      `/comunidades/${comunidadId}/reportes`,
    );

    return data.reportes;
  },

  detalle: async (reporteId: number): Promise<Reporte> => {
    const { data } = await httpClient.get<{ reporte: Reporte }>(`/reportes/${reporteId}`);

    return data.reporte;
  },

  cambiarEstado: async (
    reporteId: number,
    estado: EstadoReporte,
    comentario?: string,
  ): Promise<Reporte> => {
    const { data } = await httpClient.patch<{ reporte: Reporte }>(
      `/reportes/${reporteId}/estado`,
      { estado, comentario },
    );

    return data.reporte;
  },

  eliminar: async (reporteId: number): Promise<void> => {
    await httpClient.delete(`/reportes/${reporteId}`);
  },
};
