import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/src/features/auth/api/authApi';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import type { IniciarSesionPayload } from '@/src/features/auth/types';

export function useIniciarSesion() {
  const iniciarSesion = useAuthStore((state) => state.iniciarSesion);

  return useMutation({
    mutationFn: (payload: IniciarSesionPayload) => authApi.iniciarSesion(payload),
    onSuccess: async (respuesta) => {
      await iniciarSesion(respuesta.usuario, respuesta.token);
    },
  });
}
