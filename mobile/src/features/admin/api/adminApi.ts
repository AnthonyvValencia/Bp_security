import { httpClient } from '@/src/shared/api/httpClient';

import type { AdminUsuario, ResumenAdmin, RolUsuario } from '@/src/features/admin/types';

export const adminApi = {
  dashboard: async (): Promise<ResumenAdmin> => {
    const { data } = await httpClient.get<{ resumen: ResumenAdmin }>('/admin/dashboard');

    return data.resumen;
  },

  usuarios: async (termino?: string): Promise<AdminUsuario[]> => {
    const { data } = await httpClient.get<{ usuarios: AdminUsuario[] }>('/admin/usuarios', {
      params: termino ? { q: termino } : undefined,
    });

    return data.usuarios;
  },

  usuario: async (id: number): Promise<AdminUsuario> => {
    const { data } = await httpClient.get<{ usuario: AdminUsuario }>(`/admin/usuarios/${id}`);

    return data.usuario;
  },

  suspender: async (id: number): Promise<AdminUsuario> => {
    const { data } = await httpClient.post<{ usuario: AdminUsuario }>(
      `/admin/usuarios/${id}/suspender`,
    );

    return data.usuario;
  },

  reactivar: async (id: number): Promise<AdminUsuario> => {
    const { data } = await httpClient.post<{ usuario: AdminUsuario }>(
      `/admin/usuarios/${id}/reactivar`,
    );

    return data.usuario;
  },

  cambiarRol: async (id: number, rol: RolUsuario): Promise<AdminUsuario> => {
    const { data } = await httpClient.post<{ usuario: AdminUsuario }>(
      `/admin/usuarios/${id}/rol`,
      { rol },
    );

    return data.usuario;
  },
};
