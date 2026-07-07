import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useCrearReporte } from '@/src/features/reports/hooks/useReportes';
import type { CategoriaReporte } from '@/src/features/reports/types';
import {
  ETIQUETAS_CATEGORIA_REPORTE,
  ICONOS_CATEGORIA_REPORTE,
} from '@/src/features/reports/utils/etiquetas';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { obtenerUbicacionActual } from '@/src/shared/services/ubicacion';
import { colors } from '@/src/shared/theme/colors';

export default function NuevoReporteScreen() {
  const { categoria } = useLocalSearchParams<{ categoria: CategoriaReporte }>();
  const [descripcion, setDescripcion] = useState('');
  const { mutate, isPending, error } = useCrearReporte();

  const etiqueta = ETIQUETAS_CATEGORIA_REPORTE[categoria] ?? 'Otros';
  const mensajeError = error ? obtenerMensajeError(error, 'No se pudo enviar el reporte.') : null;

  const enviar = async () => {
    const ubicacion = await obtenerUbicacionActual();

    mutate(
      { titulo: etiqueta, descripcion, categoria, ...ubicacion },
      {
        onSuccess: () => {
          Alert.alert('Reporte enviado', 'Tu reporte fue enviado al líder de tu comunidad.', [
            { text: 'OK', onPress: () => router.replace('/(app)/reports') },
          ]);
        },
      },
    );
  };

  return (
    <PantallaSegura>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        enableOnAndroid
        extraScrollHeight={24}
      >
        <View style={styles.icono}>
          <Ionicons name={ICONOS_CATEGORIA_REPORTE[categoria]} size={32} color={colors.acento} />
        </View>
        <Text style={styles.titulo}>{etiqueta}</Text>
        <Text style={styles.subtitulo}>Cuéntanos qué pasó para informar a tu comunidad</Text>

        <Campo
          etiqueta="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          placeholder="Ej. Vi a alguien merodeando frente a la casa 12 desde hace 15 minutos"
        />

        {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

        <Boton
          titulo="Enviar reporte"
          cargando={isPending}
          disabled={descripcion.trim().length === 0}
          onPress={() => void enviar()}
        />
      </KeyboardAwareScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  error: {
    color: colors.peligro,
    textAlign: 'center',
    marginBottom: 12,
  },
});
