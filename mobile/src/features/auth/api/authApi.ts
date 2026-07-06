import { httpClient } from '@/src/shared/api/httpClient';

import type {
  IniciarSesionPayload,
  RegistroPayload,
  SesionRespuesta,
} from '@/src/features/auth/types';

export const authApi = {
  registrar: async (payload: RegistroPayload): Promise<SesionRespuesta> => {
    const { data } = await httpClient.post<SesionRespuesta>('/auth/registro', payload);

    return data;
  },

  iniciarSesion: async (payload: IniciarSesionPayload): Promise<SesionRespuesta> => {
    const { data } = await httpClient.post<SesionRespuesta>('/auth/login', payload);

    return data;
  },

  cerrarSesion: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },

  olvideContrasena: async (email: string): Promise<{ mensaje: string }> => {
    const { data } = await httpClient.post<{ mensaje: string }>('/auth/olvide-contrasena', {
      email,
    });

    return data;
  },

  restablecerContrasena: async (payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ mensaje: string }> => {
    const { data } = await httpClient.post<{ mensaje: string }>(
      '/auth/restablecer-contrasena',
      payload,
    );

    return data;
  },
};
