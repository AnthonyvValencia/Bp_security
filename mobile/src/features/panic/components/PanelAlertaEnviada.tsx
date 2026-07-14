import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { EscaladaEmergencia } from '@/src/features/panic/components/EscaladaEmergencia';
import type { AlertaEnCurso } from '@/src/features/panic/store/panicStore';
import { usePanicStore } from '@/src/features/panic/store/panicStore';
import { Boton } from '@/src/shared/components/Boton';
import { colors } from '@/src/shared/theme/colors';

const ESTADOS_CANCELABLES: AlertaEnCurso['estado'][] = [null, 'enviada'];

interface Props {
  alerta: AlertaEnCurso;
  tieneComunidad: boolean;
}

/**
 * El panel no promete más de lo que el sistema cumple: sin comunidad no hay
 * vecino que reciba la alerta, y las autoridades no se notifican solas en
 * ningún caso. De ahí que la ayuda real (911 y contactos) esté siempre a mano.
 *
 * No se auto-descarta: tiene acciones que el usuario debe poder pulsar con
 * calma en mitad de una emergencia.
 */
export function PanelAlertaEnviada({ alerta, tieneComunidad }: Props) {
  const cancelarEnCurso = usePanicStore((state) => state.cancelarEnCurso);
  const descartarAlertaEnCurso = usePanicStore((state) => state.descartarAlertaEnCurso);
  const [cancelando, setCancelando] = useState(false);

  const esCancelable = ESTADOS_CANCELABLES.includes(alerta.estado);

  const confirmarCancelar = () => {
    Alert.alert('Cancelar alerta', '¿Confirmas que quieres cancelar tu alerta de pánico?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelando(true);

          try {
            await cancelarEnCurso();
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.contenedor, !tieneComunidad && styles.contenedorSinComunidad]}>
      <View style={[styles.icono, !tieneComunidad && styles.iconoSinComunidad]}>
        <Ionicons name={tieneComunidad ? 'megaphone' : 'alert'} size={32} color="#fff" />
      </View>

      <Text style={styles.titulo}>{tieneComunidad ? 'ALERTA ENVIADA' : 'ALERTA REGISTRADA'}</Text>

      {tieneComunidad ? (
        <Text style={styles.subtitulo}>Tu comunidad ya está viendo tu alerta.</Text>
      ) : (
        <Text style={[styles.subtitulo, styles.subtituloSinComunidad]}>
          No perteneces a ninguna comunidad: ningún vecino recibirá este aviso. Llama al ECU 911 o
          avisa a tus contactos.
        </Text>
      )}

      {esCancelable ? (
        <Boton
          titulo="Cancelar alerta"
          variante="secundario"
          cargando={cancelando}
          onPress={confirmarCancelar}
        />
      ) : (
        <Boton titulo="Volver" variante="secundario" onPress={descartarAlertaEnCurso} />
      )}

      <EscaladaEmergencia latitud={alerta.latitud} longitud={alerta.longitud} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.primario,
    borderRadius: 20,
    padding: 28,
    width: '100%',
  },
  contenedorSinComunidad: {
    borderColor: colors.peligro,
  },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconoSinComunidad: {
    backgroundColor: colors.peligro,
  },
  titulo: {
    color: colors.texto,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitulo: {
    color: colors.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  subtituloSinComunidad: {
    color: colors.peligro,
    fontWeight: '600',
  },
});
