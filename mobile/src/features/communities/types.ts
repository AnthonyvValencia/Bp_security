export type EstadoComunidad = 'pendiente' | 'aprobada' | 'rechazada';
export type TipoSolicitud = 'unirse' | 'crear';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';
export type EstadoMiembro = 'activo' | 'expulsado' | 'retirado';

export interface LiderResumen {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface Comunidad {
  id: number;
  nombre: string;
  descripcion: string | null;
  barrio: string;
  estado: EstadoComunidad;
  lider?: LiderResumen;
  total_miembros?: number;
  creado_en: string;
}

export interface UsuarioResumen {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
}

export interface SolicitudMembresia {
  id: number;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  nombre_comunidad_propuesto: string | null;
  descripcion_comunidad_propuesta: string | null;
  barrio_comunidad_propuesto: string | null;
  motivo: string | null;
  usuario?: UsuarioResumen;
  creado_en: string;
}

export interface ComunidadMiembro {
  id: number;
  estado: EstadoMiembro;
  fecha_ingreso: string;
  usuario: UsuarioResumen;
}

export interface SolicitarCrearComunidadPayload {
  nombre: string;
  descripcion?: string;
  barrio: string;
}
