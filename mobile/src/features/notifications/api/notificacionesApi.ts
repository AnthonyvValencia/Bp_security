import type { ResumenNotificaciones } from '@/src/features/notifications/types';
import { httpClient } from '@/src/shared/api/httpClient';

export const notificacionesApi = {
  resumen: async (): Promise<ResumenNotificaciones> => {
    const { data } = await httpClient.get<{ resumen: ResumenNotificaciones }>(
      '/resumen-notificaciones',
    );

    return data.resumen;
  },

  marcarChatLeido: async (comunidadId: number): Promise<void> => {
    await httpClient.post(`/comunidades/${comunidadId}/chat/leido`);
  },
};
