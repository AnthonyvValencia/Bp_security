import { httpClient } from '@/src/shared/api/httpClient';

import type { MensajeChat } from '@/src/features/chat/types';

export const chatApi = {
  listar: async (comunidadId: number): Promise<MensajeChat[]> => {
    const { data } = await httpClient.get<{ mensajes: MensajeChat[] }>(
      `/comunidades/${comunidadId}/chat`,
    );

    return data.mensajes;
  },

  enviar: async (comunidadId: number, contenido: string): Promise<MensajeChat> => {
    const { data } = await httpClient.post<{ mensaje: MensajeChat }>(
      `/comunidades/${comunidadId}/chat`,
      { contenido },
    );

    return data.mensaje;
  },

  eliminar: async (mensajeId: number): Promise<void> => {
    await httpClient.delete(`/chat/mensajes/${mensajeId}`);
  },
};
