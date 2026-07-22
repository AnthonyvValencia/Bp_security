/** Contadores de pendientes que el home pinta como insignias rojas. */
export interface ResumenNotificaciones {
  /** Vecinos esperando aprobación para entrar (solo líder). */
  solicitudes_ingreso: number;
  /** Alertas de pánico sin resolver de la comunidad (solo líder). */
  alertas_abiertas: number;
  /** Reportes abiertos o en revisión de la comunidad (solo líder). */
  reportes_abiertos: number;
  /** Mensajes ajenos del chat posteriores a la última lectura. */
  chat_no_leidos: number;
}
