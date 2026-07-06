import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/store/authStore';

export default function IndexRoute() {
  const token = useAuthStore((state) => state.token);

  return <Redirect href={token ? '/(app)' : '/(auth)/login'} />;
}
