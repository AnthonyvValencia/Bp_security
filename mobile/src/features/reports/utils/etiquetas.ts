import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';

import type { CategoriaReporte, EstadoReporte } from '@/src/features/reports/types';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export const ETIQUETAS_CATEGORIA_REPORTE: Record<CategoriaReporte, string> = {
  persona_sospechosa: 'Persona sospechosa',
  luz_daniada: 'Luz de calle dañada',
  vehiculo_mal_estacionado: 'Vehículo mal estacionado',
  ruidos_molestos: 'Ruidos molestos',
  otro: 'Otros',
};

export const ICONOS_CATEGORIA_REPORTE: Record<CategoriaReporte, NombreIcono> = {
  persona_sospechosa: 'eye-outline',
  luz_daniada: 'bulb-outline',
  vehiculo_mal_estacionado: 'car-outline',
  ruidos_molestos: 'volume-high-outline',
  otro: 'help-circle-outline',
};

export const ETIQUETAS_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  abierto: 'Abierto',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  descartado: 'Descartado',
};

export const COLORES_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  abierto: colors.peligro,
  en_revision: colors.acento,
  resuelto: colors.exito,
  descartado: colors.textoSecundario,
};
