import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useOlvideContrasena } from '@/src/features/auth/hooks/useOlvideContrasena';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { EncabezadoAuth } from '@/src/shared/components/EncabezadoAuth';
import { colors } from '@/src/shared/theme/colors';

export default function OlvideContrasenaScreen() {
  const [email, setEmail] = useState('');
  const { mutate, isPending, isSuccess, error } = useOlvideContrasena();

  const mensajeError = error
    ? obtenerMensajeError(error, 'No se pudo enviar el enlace de recuperación.')
    : null;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contenedor}
      enableOnAndroid
      extraScrollHeight={24}
    >
      <EncabezadoAuth
        icono="key-outline"
        titulo="RECUPERAR CONTRASEÑA"
        subtitulo="Te enviaremos un enlace a tu correo"
      />

      <Campo
        etiqueta="Correo electrónico"
        icono="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {isSuccess ? (
        <Text style={styles.exito}>
          Si el correo existe, te enviamos un enlace de recuperación. Revisa tu bandeja de entrada.
        </Text>
      ) : null}
      {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

      <Boton titulo="ENVIAR ENLACE" cargando={isPending} onPress={() => mutate(email)} />

      <Link href="/(auth)/restablecer-contrasena" style={styles.enlace}>
        Ya tengo un código, restablecer contraseña
      </Link>
      <Link href="/(auth)/login" style={styles.enlace}>
        Volver a iniciar sesión
      </Link>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.fondo,
  },
  exito: {
    color: colors.exito,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },
  error: {
    color: colors.peligro,
    textAlign: 'center',
    marginBottom: 12,
  },
  enlace: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
});
