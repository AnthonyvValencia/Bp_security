import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/src/features/auth/api/authApi';
import type { RegistroPayload } from '@/src/features/auth/types';

export function useRegistro() {
  return useMutation({
    mutationFn: (payload: RegistroPayload) => authApi.registrar(payload),
  });
}
