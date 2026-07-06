import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/src/features/auth/api/authApi';

interface RestablecerContrasenaInput {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export function useRestablecerContrasena() {
  return useMutation({
    mutationFn: (payload: RestablecerContrasenaInput) => authApi.restablecerContrasena(payload),
  });
}
