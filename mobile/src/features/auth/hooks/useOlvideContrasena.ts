import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/src/features/auth/api/authApi';

export function useOlvideContrasena() {
  return useMutation({
    mutationFn: (email: string) => authApi.olvideContrasena(email),
  });
}
