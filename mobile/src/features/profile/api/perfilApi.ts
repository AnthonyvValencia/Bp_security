import { httpClient } from '@/src/shared/api/httpClient';

import type { Usuario } from '@/src/features/auth/types';

export type ActualizarPerfilPayload = Partial<
  Pick<
    Usuario,
    | 'nombres'
    | 'apellidos'
    | 'telefono'
    | 'direccion'
    | 'barrio'
    | 'numero_casa'
    | 'referencias_domicilio'
    | 'tipo_sangre'
    | 'condiciones_medicas'
  >
>;

export const perfilApi = {
  mostrar: async (): Promise<Usuario> => {
    const { data } = await httpClient.get<{ usuario: Usuario }>('/perfil');

    return data.usuario;
  },

  actualizar: async (payload: ActualizarPerfilPayload): Promise<Usuario> => {
    const { data } = await httpClient.patch<{ usuario: Usuario }>('/perfil', payload);

    return data.usuario;
  },
};
