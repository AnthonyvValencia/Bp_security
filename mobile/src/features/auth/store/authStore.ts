import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { Usuario } from '@/src/features/auth/types';

const CLAVE_TOKEN = 'bp_security_token';
const CLAVE_USUARIO = 'bp_security_usuario';

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  estaHidratado: boolean;
  hidratar: () => Promise<void>;
  iniciarSesion: (usuario: Usuario, token: string) => Promise<void>;
  actualizarUsuario: (usuario: Usuario) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  usuario: null,
  estaHidratado: false,

  hidratar: async () => {
    const [token, usuarioJson] = await Promise.all([
      SecureStore.getItemAsync(CLAVE_TOKEN),
      SecureStore.getItemAsync(CLAVE_USUARIO),
    ]);

    set({
      token,
      usuario: usuarioJson ? (JSON.parse(usuarioJson) as Usuario) : null,
      estaHidratado: true,
    });
  },

  iniciarSesion: async (usuario, token) => {
    await Promise.all([
      SecureStore.setItemAsync(CLAVE_TOKEN, token),
      SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario)),
    ]);

    set({ token, usuario });
  },

  actualizarUsuario: async (usuario) => {
    await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));

    set({ usuario });
  },

  cerrarSesion: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(CLAVE_TOKEN),
      SecureStore.deleteItemAsync(CLAVE_USUARIO),
    ]);

    set({ token: null, usuario: null });
  },
}));
