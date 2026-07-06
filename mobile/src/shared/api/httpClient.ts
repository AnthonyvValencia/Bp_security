import axios from 'axios';

import { API_BASE_URL } from '@/src/config/env';
import { useAuthStore } from '@/src/features/auth/store/authStore';

// eslint-disable-next-line import/no-named-as-default-member -- axios.create es el uso correcto, falso positivo conocido de la regla
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().cerrarSesion();
    }

    return Promise.reject(error);
  },
);
