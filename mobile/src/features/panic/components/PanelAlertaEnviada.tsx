import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import type { AlertaEnCurso } from '@/src/features/panic/store/panicStore';
import { usePanicStore } from '@/src/features/panic/store/panicStore';
import { Boton } from '@/src/shared/components/Boton';
import { colors } from '@/src/shared/theme/colors';

const ESTADOS_CANCELABLES: AlertaEnCurso['estado'][] = [null, 'enviada'];
const DURACION_VISIBLE_MS = 6000;

export function PanelAlertaEnviada({ alerta }: { alerta: AlertaEnCurso }) {
  const cancelarEnCurso = usePanicStore((state) => state.cancelarEnCurso);
  const descartarAlertaEnCurso = usePanicStore((state) => state.descartarAlertaEnCurso);
  const [cancelando, setCancelando] = useState(false);

  const esCancelable = ESTADOS_CANCELABLES.includes(alerta.estado);

  useEffect(() => {
    const temporizador = setTimeout(() => descartarAlertaEnCurso(), DURACION_VISIBLE_MS);

    return () => clearTimeout(temporizador);
  }, [alerta.idCliente, descartarAlertaEnCurso]);

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
    <View style={styles.contenedor}>
      <View style={styles.icono}>
        <Ionicons name="megaphone" size={32} color="#fff" />
      </View>

      <Text style={styles.titulo}>ALERTA ENVIADA</Text>
      <Text style={styles.subtitulo}>Vecinos y autoridades han sido notificados</Text>

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
  icono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
});
