export type EstadoAlerta = 'enviada' | 'reconocida' | 'resuelta' | 'falsa_alarma' | 'cancelada';

export interface UsuarioAlertaResumen {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
}

export interface AlertaPanico {
  id: number;
  id_cliente: string;
  comunidad_id: number | null;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoAlerta;
  creada_en: string;
  reconocido_en: string | null;
  resuelto_en: string | null;
  notas: string | null;
  usuario?: UsuarioAlertaResumen;
}

export interface ActivarAlertaPayload {
  id_cliente: string;
  latitud: number | null;
  longitud: number | null;
  creada_en: string;
}
