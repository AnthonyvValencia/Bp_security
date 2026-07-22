import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/store/authStore';

export default function IndexRoute() {
  const token = useAuthStore((state) => state.token);

  // Sin sesión: la landing informativa es la puerta de entrada (de ahí al login).
  return <Redirect href={token ? '/(app)' : '/(auth)/bienvenida'} />;
}
