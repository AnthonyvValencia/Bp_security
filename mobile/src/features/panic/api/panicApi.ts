import { httpClient } from '@/src/shared/api/httpClient';

import type { ActivarAlertaPayload, AlertaPanico } from '@/src/features/panic/types';

export const panicApi = {
  activar: async (payload: ActivarAlertaPayload): Promise<AlertaPanico> => {
    const { data } = await httpClient.post<{ alerta: AlertaPanico }>('/alertas-panico', payload);

    return data.alerta;
  },

  historialPropio: async (): Promise<AlertaPanico[]> => {
    const { data } = await httpClient.get<{ alertas: AlertaPanico[] }>('/alertas-panico');

    return data.alertas;
  },

  porComunidad: async (comunidadId: number): Promise<AlertaPanico[]> => {
    const { data } = await httpClient.get<{ alertas: AlertaPanico[] }>(
      `/comunidades/${comunidadId}/alertas-panico`,
    );

    return data.alertas;
  },

  cancelar: async (alertaId: number): Promise<AlertaPanico> => {
    const { data } = await httpClient.patch<{ alerta: AlertaPanico }>(
      `/alertas-panico/${alertaId}/cancelar`,
    );

    return data.alerta;
  },

  reconocer: async (alertaId: number): Promise<AlertaPanico> => {
    const { data } = await httpClient.patch<{ alerta: AlertaPanico }>(
      `/alertas-panico/${alertaId}/reconocer`,
    );

    return data.alerta;
  },

  resolver: async (alertaId: number, notas?: string): Promise<AlertaPanico> => {
    const { data } = await httpClient.patch<{ alerta: AlertaPanico }>(
      `/alertas-panico/${alertaId}/resolver`,
      { notas },
    );

    return data.alerta;
  },

  falsaAlarma: async (alertaId: number, notas?: string): Promise<AlertaPanico> => {
    const { data } = await httpClient.patch<{ alerta: AlertaPanico }>(
      `/alertas-panico/${alertaId}/falsa-alarma`,
      { notas },
    );

    return data.alerta;
  },

  eliminar: async (alertaId: number): Promise<void> => {
    await httpClient.delete(`/alertas-panico/${alertaId}`);
  },
};
