import { httpClient } from '@/src/shared/api/httpClient';

import type {
  Comunidad,
  ComunidadMiembro,
  MuroItem,
  SolicitarCrearComunidadPayload,
  SolicitudMembresia,
} from '@/src/features/communities/types';

export const comunidadesApi = {
  buscar: async (termino?: string): Promise<Comunidad[]> => {
    const { data } = await httpClient.get<{ comunidades: Comunidad[] }>('/comunidades', {
      params: termino ? { q: termino } : undefined,
    });

    return data.comunidades;
  },

  detalle: async (id: number): Promise<Comunidad> => {
    const { data } = await httpClient.get<{ comunidad: Comunidad }>(`/comunidades/${id}`);

    return data.comunidad;
  },

  miComunidad: async (): Promise<Comunidad | null> => {
    const { data } = await httpClient.get<{ comunidad: Comunidad | null }>('/mi-comunidad');

    return data.comunidad;
  },

  solicitarCreacion: async (
    payload: SolicitarCrearComunidadPayload,
  ): Promise<SolicitudMembresia> => {
    const { data } = await httpClient.post<{ solicitud: SolicitudMembresia }>(
      '/comunidades',
      payload,
    );

    return data.solicitud;
  },

  solicitarIngreso: async (comunidadId: number): Promise<SolicitudMembresia> => {
    const { data } = await httpClient.post<{ solicitud: SolicitudMembresia }>(
      `/comunidades/${comunidadId}/solicitudes`,
    );

    return data.solicitud;
  },

  solicitudesPendientes: async (comunidadId: number): Promise<SolicitudMembresia[]> => {
    const { data } = await httpClient.get<{ solicitudes: SolicitudMembresia[] }>(
      `/comunidades/${comunidadId}/solicitudes`,
    );

    return data.solicitudes;
  },

  aprobarSolicitud: async (solicitudId: number): Promise<ComunidadMiembro> => {
    const { data } = await httpClient.post<{ miembro: ComunidadMiembro }>(
      `/solicitudes-membresia/${solicitudId}/aprobar`,
    );

    return data.miembro;
  },

  rechazarSolicitud: async (solicitudId: number, motivo?: string): Promise<void> => {
    await httpClient.post(`/solicitudes-membresia/${solicitudId}/rechazar`, { motivo });
  },

  miembros: async (comunidadId: number): Promise<ComunidadMiembro[]> => {
    const { data } = await httpClient.get<{ miembros: ComunidadMiembro[] }>(
      `/comunidades/${comunidadId}/miembros`,
    );

    return data.miembros;
  },

  expulsarMiembro: async (comunidadId: number, miembroId: number): Promise<void> => {
    await httpClient.delete(`/comunidades/${comunidadId}/miembros/${miembroId}`);
  },

  pendientesAprobacion: async (): Promise<SolicitudMembresia[]> => {
    const { data } = await httpClient.get<{ solicitudes: SolicitudMembresia[] }>(
      '/admin/comunidades/pendientes',
    );

    return data.solicitudes;
  },

  aprobarComunidad: async (solicitudId: number): Promise<Comunidad> => {
    const { data } = await httpClient.post<{ comunidad: Comunidad }>(
      `/admin/comunidades/solicitudes/${solicitudId}/aprobar`,
    );

    return data.comunidad;
  },

  rechazarComunidad: async (solicitudId: number, motivo?: string): Promise<void> => {
    await httpClient.post(`/admin/comunidades/solicitudes/${solicitudId}/rechazar`, { motivo });
  },

  muro: async (comunidadId: number): Promise<MuroItem[]> => {
    const { data } = await httpClient.get<{ muro: MuroItem[] }>(
      `/comunidades/${comunidadId}/muro`,
    );

    return data.muro;
  },
};
