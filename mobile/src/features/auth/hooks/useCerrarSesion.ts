import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/src/features/auth/api/authApi';
import { useAuthStore } from '@/src/features/auth/store/authStore';

export function useCerrarSesion() {
  const cerrarSesionLocal = useAuthStore((state) => state.cerrarSesion);

  return useMutation({
    mutationFn: () => authApi.cerrarSesion(),
    onSettled: async () => {
      // Se limpia la sesión local incluso si la llamada al backend falla
      // (ej. sin conexión) para no dejar al usuario atrapado en la app.
      await cerrarSesionLocal();
    },
  });
}
