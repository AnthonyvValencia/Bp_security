import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MuroItem } from '@/src/features/communities/types';
import type { EstadoAlerta } from '@/src/features/panic/types';
import {
  COLORES_ESTADO_ALERTA,
  ETIQUETAS_ESTADO_ALERTA,
} from '@/src/features/panic/utils/estadoAlerta';
import type { CategoriaReporte, EstadoReporte } from '@/src/features/reports/types';
import {
  COLORES_ESTADO_REPORTE,
  ETIQUETAS_ESTADO_REPORTE,
  ICONOS_CATEGORIA_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

function descripcion(item: MuroItem): string {
  if (item.tipo === 'alerta_panico') {
    return '¡Botón de pánico activado!';
  }

  return item.titulo;
}

function etiquetaEstado(item: MuroItem): string {
  return item.tipo === 'alerta_panico'
    ? (ETIQUETAS_ESTADO_ALERTA[item.estado as EstadoAlerta] ?? item.estado)
    : (ETIQUETAS_ESTADO_REPORTE[item.estado as EstadoReporte] ?? item.estado);
}

function colorEstado(item: MuroItem): string {
  return item.tipo === 'alerta_panico'
    ? (COLORES_ESTADO_ALERTA[item.estado as EstadoAlerta] ?? colors.textoSecundario)
    : (COLORES_ESTADO_REPORTE[item.estado as EstadoReporte] ?? colors.textoSecundario);
}

function obtenerIcono(item: MuroItem): NombreIcono {
  if (item.tipo === 'alerta_panico') {
    return 'megaphone';
  }

  return ICONOS_CATEGORIA_REPORTE[item.categoria as CategoriaReporte] ?? 'alert-circle';
}

function abrirUbicacion(latitud: number, longitud: number) {
  void Linking.openURL(`https://www.google.com/maps?q=${latitud},${longitud}`);
}

export function MuroIncidenciaCard({ item }: { item: MuroItem }) {
  const esAlerta = item.tipo === 'alerta_panico';

  return (
    <View style={styles.fila}>
      <View style={[styles.icono, esAlerta ? styles.iconoAlerta : styles.iconoReporte]}>
        <Ionicons name={obtenerIcono(item)} size={18} color="#fff" />
      </View>

      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.nombre} numberOfLines={1}>
            {item.usuario.nombres} · {new Date(item.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[styles.estado, { color: colorEstado(item) }]}>{etiquetaEstado(item)}</Text>
        </View>
        <Text style={[styles.mensaje, esAlerta && styles.mensajeAlerta]}>{descripcion(item)}</Text>

        {item.tipo === 'reporte' && item.descripcion ? (
          <Text style={styles.detalle}>{item.descripcion}</Text>
        ) : null}

        {esAlerta && item.latitud !== null && item.longitud !== null ? (
          <Pressable onPress={() => abrirUbicacion(item.latitud as number, item.longitud as number)}>
            <Text style={styles.ubicacion}>ubicación</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  icono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoAlerta: {
    backgroundColor: colors.primario,
  },
  iconoReporte: {
    backgroundColor: colors.superficieAlterna,
  },
  contenido: {
    flex: 1,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nombre: {
    color: colors.textoSecundario,
    fontSize: 11,
    flexShrink: 1,
  },
  estado: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mensaje: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  mensajeAlerta: {
    color: colors.primario,
  },
  detalle: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 2,
  },
  ubicacion: {
    color: colors.acento,
    fontSize: 12,
    marginTop: 4,
  },
});
