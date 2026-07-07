export type RolUsuario = 'administrador' | 'lider' | 'ciudadano';
export type EstadoUsuario = 'activo' | 'suspendido';
export type TipoSangre = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface ContactoEmergencia {
  id: number;
  nombre: string;
  telefono: string;
  parentesco: string | null;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  direccion: string;
  barrio: string;
  numero_casa: string;
  referencias_domicilio: string | null;
  foto: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  tipo_sangre: TipoSangre | null;
  condiciones_medicas: string | null;
  latitud: number | null;
  longitud: number | null;
  miembro_desde: string;
  contactos_emergencia?: ContactoEmergencia[];
}

export interface RegistroPayload {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefono: string;
  direccion: string;
  barrio: string;
  numero_casa: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface IniciarSesionPayload {
  email: string;
  password: string;
}

export interface SesionRespuesta {
  usuario: Usuario;
  token: string;
}
