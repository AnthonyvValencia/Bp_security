import { useMutation, useQueryClient } from '@tanstack/react-query';

import { perfilApi, type ActualizarPerfilPayload } from '@/src/features/profile/api/perfilApi';
import { CLAVE_PERFIL } from '@/src/features/profile/hooks/usePerfil';
import { useAuthStore } from '@/src/features/auth/store/authStore';

export function useActualizarPerfil() {
  const queryClient = useQueryClient();
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario);

  return useMutation({
    mutationFn: (payload: ActualizarPerfilPayload) => perfilApi.actualizar(payload),
    onSuccess: async (usuario) => {
      queryClient.setQueryData(CLAVE_PERFIL, usuario);
      await actualizarUsuario(usuario);
    },
  });
}
