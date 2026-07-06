import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useSolicitarCreacionComunidad } from '@/src/features/communities/hooks/useComunidades';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function CrearComunidadScreen() {
  const [form, setForm] = useState({ nombre: '', descripcion: '', barrio: '' });
  const { mutate, isPending, error } = useSolicitarCreacionComunidad();

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) =>
    setForm((anterior) => ({ ...anterior, [campo]: valor }));

  const mensajeError = error ? obtenerMensajeError(error, 'No se pudo enviar la solicitud.') : null;

  const enviar = () => {
    mutate(form, {
      onSuccess: () => {
        Alert.alert(
          'Solicitud enviada',
          'Tu solicitud para crear la comunidad fue enviada. Un administrador la revisará pronto.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      },
    });
  };

  return (
    <PantallaSegura>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        enableOnAndroid
        extraScrollHeight={24}
      >
        <Text style={styles.titulo}>Solicitar crear comunidad</Text>
        <Text style={styles.subtitulo}>
          Un administrador revisará tu solicitud. Si es aprobada, serás asignado automáticamente
          como líder de la comunidad.
        </Text>

        <Campo
          etiqueta="Nombre de la comunidad"
          value={form.nombre}
          onChangeText={actualizarCampo('nombre')}
          placeholder="La Floresta"
        />
        <Campo
          etiqueta="Barrio"
          value={form.barrio}
          onChangeText={actualizarCampo('barrio')}
          placeholder="La Floresta"
        />
        <Campo
          etiqueta="Descripción (opcional)"
          value={form.descripcion}
          onChangeText={actualizarCampo('descripcion')}
          multiline
        />

        {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

        <Boton titulo="Enviar solicitud" cargando={isPending} onPress={enviar} />
      </KeyboardAwareScrollView>
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginBottom: 20,
  },
  error: {
    color: colors.peligro,
    textAlign: 'center',
    marginBottom: 12,
  },
});
