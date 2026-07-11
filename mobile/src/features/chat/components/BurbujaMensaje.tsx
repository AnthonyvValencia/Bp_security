import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MensajeChat } from '@/src/features/chat/types';
import { colors } from '@/src/shared/theme/colors';

interface BurbujaMensajeProps {
  mensaje: MensajeChat;
  esPropio: boolean;
  puedeEliminar: boolean;
  onEliminar: (mensajeId: number) => void;
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function BurbujaMensaje({
  mensaje,
  esPropio,
  puedeEliminar,
  onEliminar,
}: BurbujaMensajeProps) {
  const autor = mensaje.usuario
    ? `${mensaje.usuario.nombres} ${mensaje.usuario.apellidos}`
    : 'Vecino';

  return (
    <Pressable
      onLongPress={puedeEliminar ? () => onEliminar(mensaje.id) : undefined}
      style={[styles.fila, esPropio ? styles.filaPropia : styles.filaAjena]}
    >
      <View style={[styles.burbuja, esPropio ? styles.burbujaPropia : styles.burbujaAjena]}>
        {!esPropio ? <Text style={styles.autor}>{autor}</Text> : null}
        <Text style={[styles.contenido, esPropio && styles.contenidoPropio]}>
          {mensaje.contenido}
        </Text>
        <Text style={[styles.hora, esPropio && styles.horaPropia]}>
          {formatearHora(mensaje.creado_en)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filaPropia: {
    justifyContent: 'flex-end',
  },
  filaAjena: {
    justifyContent: 'flex-start',
  },
  burbuja: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  burbujaPropia: {
    backgroundColor: colors.acento,
    borderBottomRightRadius: 4,
  },
  burbujaAjena: {
    backgroundColor: colors.superficieAlterna,
    borderBottomLeftRadius: 4,
  },
  autor: {
    color: colors.acento,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  contenido: {
    color: colors.texto,
    fontSize: 15,
  },
  contenidoPropio: {
    color: colors.fondo,
  },
  hora: {
    color: colors.textoTenue,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  horaPropia: {
    color: colors.superficie,
  },
});
