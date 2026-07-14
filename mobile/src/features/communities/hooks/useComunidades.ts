import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { comunidadesApi } from '@/src/features/communities/api/comunidadesApi';
import type { SolicitarCrearComunidadPayload } from '@/src/features/communities/types';
import { obtenerEcho } from '@/src/shared/services/realtime';

export const CLAVE_MI_COMUNIDAD = ['mi-comunidad'] as const;

export function useBuscarComunidades(termino?: string) {
  return useQuery({
    queryKey: ['comunidades', termino ?? ''],
    queryFn: () => comunidadesApi.buscar(termino),
  });
}

export function useComunidad(id: number) {
  const queryClient = useQueryClient();
  const esValido = Number.isFinite(id) && id > 0;

  // Cambios de miembros (ingresos, expulsiones, salidas) y de estado
  // (suspendida/reactivada) llegan por el canal de la comunidad: el detalle
  // y la lista de miembros se refrescan al instante.
  useEffect(() => {
    if (!esValido) {
      return;
    }

    const canal = obtenerEcho().private(`comunidad.${id}`);

    const manejador = () => {
      void queryClient.invalidateQueries({ queryKey: ['comunidad', id] });
      void queryClient.invalidateQueries({ queryKey: ['miembros', id] });
    };

    canal.listen('.comunidad.actualizada', manejador);

    return () => {
      canal.stopListening('.comunidad.actualizada', manejador);
    };
  }, [id, esValido, queryClient]);

  return useQuery({
    queryKey: ['comunidad', id],
    queryFn: () => comunidadesApi.detalle(id),
    enabled: esValido,
    staleTime: 0,
    // "Conectados" es presencia por ventana de actividad (últimos 5 min):
    // nadie emite un evento al desconectarse, así que se refresca periódicamente.
    refetchInterval: 15000,
  });
}

export function useMiComunidad() {
  return useQuery({
    queryKey: CLAVE_MI_COMUNIDAD,
    queryFn: comunidadesApi.miComunidad,
  });
}

/**
 * Escucha el ciclo de vida de la comunidad del usuario (suspendida,
 * reactivada, eliminada por el admin) y los cambios de su propia membresía
 * (comunidad aprobada, ingreso aprobado/rechazado, expulsión). Va montado
 * en el layout — no por pantalla — para que la app reaccione al instante
 * estés donde estés: si te aprueban la comunidad aparece de inmediato, y
 * si la eliminan (o te expulsan) el home vuelve a "sin comunidad" sin
 * necesidad de reiniciar la app.
 */
export function useComunidadTiempoRealGlobal() {
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);
  const usuarioId = usuario?.id;
  const { data: comunidad } = useMiComunidad();
  const comunidadId = comunidad?.id;

  // Canal personal: cambios de membresía decididos por terceros (admin/líder).
  useEffect(() => {
    if (!usuarioId) {
      return;
    }

    const canal = obtenerEcho().private(`App.Models.User.${usuarioId}`);

    const manejador = (evento: { evento: string; comunidad_id: number | null }) => {
      if (evento.evento === 'expulsado') {
        queryClient.setQueryData(CLAVE_MI_COMUNIDAD, null);
      }

      void queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD });
    };

    canal.listen('.membresia.actualizada', manejador);

    return () => {
      canal.stopListening('.membresia.actualizada', manejador);
    };
  }, [usuarioId, queryClient]);

  useEffect(() => {
    if (!comunidadId) {
      return;
    }

    const canal = obtenerEcho().private(`comunidad.${comunidadId}`);

    const manejador = (evento: { comunidad_id: number; estado: string }) => {
      if (evento.estado === 'eliminada') {
        // Soltar la comunidad al instante, sin esperar el refetch: el home
        // oculta muro/chat y los guards de "sin comunidad" se activan solos.
        queryClient.setQueryData(CLAVE_MI_COMUNIDAD, null);
        queryClient.removeQueries({ queryKey: ['comunidad', evento.comunidad_id] });
      }

      void queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD });
    };

    canal.listen('.comunidad.actualizada', manejador);

    return () => {
      canal.stopListening('.comunidad.actualizada', manejador);
    };
  }, [comunidadId, queryClient]);
}

export function useSolicitarCreacionComunidad() {
  return useMutation({
    mutationFn: (payload: SolicitarCrearComunidadPayload) =>
      comunidadesApi.solicitarCreacion(payload),
  });
}

export function useSolicitarIngreso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comunidadId: number) => comunidadesApi.solicitarIngreso(comunidadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD }),
  });
}

export function useSalirComunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: comunidadesApi.salir,
    onSuccess: () => {
      // Efecto inmediato: el home y los guards de "sin comunidad" reaccionan
      // sin esperar el refetch.
      queryClient.setQueryData(CLAVE_MI_COMUNIDAD, null);
      void queryClient.invalidateQueries({ queryKey: CLAVE_MI_COMUNIDAD });
    },
  });
}

export function useMuroComunidad(comunidadId: number) {
  const queryClient = useQueryClient();
  const clave = ['comunidad', comunidadId, 'muro'] as const;
  const esValido = Number.isFinite(comunidadId) && comunidadId > 0;

  useEffect(() => {
    if (!esValido) {
      return;
    }

    // El muro es un feed combinado (alertas + reportes) que el servidor
    // arma y ordena. Ante un evento de cualquiera de los dos canales,
    // refrescamos la consulta para traer el muro reordenado al instante.
    const canalReportes = obtenerEcho().private(`comunidad.${comunidadId}.reportes`);
    const canalAlertas = obtenerEcho().private(`comunidad.${comunidadId}.alertas-panico`);

    const refrescar = () => {
      void queryClient.invalidateQueries({ queryKey: clave });
    };

    canalReportes.listen('.reporte.actualizado', refrescar);
    canalAlertas.listen('.alerta.actualizada', refrescar);

    return () => {
      canalReportes.stopListening('.reporte.actualizado', refrescar);
      canalAlertas.stopListening('.alerta.actualizada', refrescar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clave se deriva de comunidadId
  }, [comunidadId, esValido, queryClient]);

  return useQuery({
    queryKey: clave,
    queryFn: () => comunidadesApi.muro(comunidadId),
    enabled: esValido,
    staleTime: 0,
    // Respaldo por si el WebSocket se desconecta.
    refetchInterval: 30000,
  });
}
