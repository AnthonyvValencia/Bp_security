export type CategoriaReporte =
  | 'persona_sospechosa'
  | 'luz_daniada'
  | 'vehiculo_mal_estacionado'
  | 'ruidos_molestos'
  | 'otro';
export type EstadoReporte = 'abierto' | 'en_revision' | 'resuelto' | 'descartado';

export interface UsuarioReporteResumen {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
}

export interface HistorialEstadoReporte {
  id: number;
  estado_anterior: EstadoReporte;
  estado_nuevo: EstadoReporte;
  comentario: string | null;
  cambiado_por?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  creado_en: string;
}

export interface Reporte {
  id: number;
  comunidad_id: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaReporte;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoReporte;
  creado_en: string;
  usuario?: UsuarioReporteResumen;
  historial?: HistorialEstadoReporte[];
}

export interface CrearReportePayload {
  titulo: string;
  descripcion: string;
  categoria: CategoriaReporte;
  latitud: number | null;
  longitud: number | null;
}
