import { httpClient } from '@/src/shared/api/httpClient';

import type { ContactoEmergencia } from '@/src/features/auth/types';

export interface ContactoEmergenciaPayload {
  nombre: string;
  telefono: string;
  parentesco?: string;
}

export const contactosEmergenciaApi = {
  listar: async (): Promise<ContactoEmergencia[]> => {
    const { data } = await httpClient.get<{ contactos_emergencia: ContactoEmergencia[] }>(
      '/contactos-emergencia',
    );

    return data.contactos_emergencia;
  },

  crear: async (payload: ContactoEmergenciaPayload): Promise<ContactoEmergencia> => {
    const { data } = await httpClient.post<{ contacto_emergencia: ContactoEmergencia }>(
      '/contactos-emergencia',
      payload,
    );

    return data.contacto_emergencia;
  },

  eliminar: async (id: number): Promise<void> => {
    await httpClient.delete(`/contactos-emergencia/${id}`);
  },
};
