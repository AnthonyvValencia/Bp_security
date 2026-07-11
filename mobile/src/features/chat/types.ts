export interface AutorMensaje {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface MensajeChat {
  id: number;
  comunidad_id: number;
  usuario_id: number;
  contenido: string;
  creado_en: string;
  usuario?: AutorMensaje;
}
