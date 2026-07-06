import { useQuery } from '@tanstack/react-query';

import { perfilApi } from '@/src/features/profile/api/perfilApi';

export const CLAVE_PERFIL = ['perfil'] as const;

export function usePerfil() {
  return useQuery({
    queryKey: CLAVE_PERFIL,
    queryFn: perfilApi.mostrar,
  });
}
