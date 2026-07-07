import type { EstadoAlerta } from '@/src/features/panic/types';
import { colors } from '@/src/shared/theme/colors';

export const ETIQUETAS_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  enviada: 'Enviada',
  reconocida: 'Reconocida',
  resuelta: 'Resuelta',
  falsa_alarma: 'Falsa alarma',
  cancelada: 'Cancelada',
};

export const COLORES_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  enviada: colors.peligro,
  reconocida: colors.acento,
  resuelta: colors.exito,
  falsa_alarma: colors.textoSecundario,
  cancelada: colors.textoSecundario,
};
