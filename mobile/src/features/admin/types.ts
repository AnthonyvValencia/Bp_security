export type RolUsuario = 'administrador' | 'lider' | 'ciudadano';
export type EstadoUsuarioAdmin = 'activo' | 'suspendido';

export interface AdminUsuario {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  email: string;
  telefono: string | null;
  barrio: string | null;
  direccion: string | null;
  numero_casa: string | null;
  referencias_domicilio: string | null;
  foto: string | null;
  rol: RolUsuario;
  estado: EstadoUsuarioAdmin;
  miembro_desde: string;
  comunidad: { id: number; nombre: string } | null;
}

export interface AuditoriaEntrada {
  id: number;
  accion: string;
  usuario: { id: number; nombres: string; apellidos: string } | null;
  creado_en: string;
}

export interface ResumenAdmin {
  usuarios: {
    total: number;
    suspendidos: number;
    administradores: number;
    lideres: number;
    ciudadanos: number;
  };
  comunidades: {
    activas: number;
    suspendidas: number;
    pendientes: number;
  };
  actividad: {
    alertas: number;
    reportes: number;
  };
  auditoria_reciente: AuditoriaEntrada[];
}
