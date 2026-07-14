import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { adminApi } from '@/src/features/admin/api/adminApi';
import type { RolUsuario } from '@/src/features/admin/types';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { obtenerEcho } from '@/src/shared/services/realtime';

const CLAVE_DASHBOARD = ['admin-dashboard'] as const;
const CLAVE_USUARIOS = ['admin-usuarios'] as const;

/**
 * Mantiene TODO el panel del admin en vivo. Va montado en el layout (no por
 * pantalla) para que el panel esté al día sin importar dónde esté el admin:
 * un registro, un login, una alerta, un reporte, una comunidad creada o
 * suspendida, una expulsión... todo pasa por el Auditor del backend, que
 * emite una única señal por este canal.
 */
export function useAdminTiempoRealGlobal() {
  const queryClient = useQueryClient();
  const rol = useAuthStore((state) => state.usuario?.rol);
  const esAdmin = rol === 'administrador';

  useEffect(() => {
    // El canal admin.panel solo autoriza a administradores: si no lo es, ni
    // se intenta la suscripción (evita un 403 en /broadcasting/auth).
    if (!esAdmin) {
      return;
    }

    const canal = obtenerEcho().private('admin.panel');

    const manejador = () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_DASHBOARD });
      void queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      void queryClient.invalidateQueries({ queryKey: ['admin-usuario'] });
      void queryClient.invalidateQueries({ queryKey: ['comunidades-gestionables'] });
      void queryClient.invalidateQueries({ queryKey: ['comunidades-pendientes-aprobacion'] });
    };

    canal.listen('.admin.panel.actualizado', manejador);

    return () => {
      canal.stopListening('.admin.panel.actualizado', manejador);
    };
  }, [esAdmin, queryClient]);
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: CLAVE_DASHBOARD,
    queryFn: adminApi.dashboard,
    // Las métricas llegan en vivo por el canal admin.panel; el refetch al
    // entrar y el repaso periódico quedan solo como respaldo si el WebSocket
    // se cae.
    staleTime: 0,
    refetchInterval: 60000,
  });
}

export function useAdminUsuarios(termino?: string) {
  return useQuery({
    queryKey: [...CLAVE_USUARIOS, termino ?? ''],
    queryFn: () => adminApi.usuarios(termino || undefined),
    staleTime: 0,
  });
}

export function useAdminUsuario(id: number) {
  const esValido = Number.isFinite(id) && id > 0;

  return useQuery({
    queryKey: ['admin-usuario', id],
    queryFn: () => adminApi.usuario(id),
    enabled: esValido,
    staleTime: 0,
  });
}

function useMutacionUsuario<TArg>(accion: (arg: TArg) => Promise<unknown>, usuarioId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      void queryClient.invalidateQueries({ queryKey: ['admin-usuario', usuarioId] });
      void queryClient.invalidateQueries({ queryKey: CLAVE_DASHBOARD });
    },
  });
}

export function useSuspenderUsuario(usuarioId: number) {
  return useMutacionUsuario(() => adminApi.suspender(usuarioId), usuarioId);
}

export function useReactivarUsuario(usuarioId: number) {
  return useMutacionUsuario(() => adminApi.reactivar(usuarioId), usuarioId);
}

export function useCambiarRolUsuario(usuarioId: number) {
  return useMutacionUsuario((rol: RolUsuario) => adminApi.cambiarRol(usuarioId, rol), usuarioId);
}
