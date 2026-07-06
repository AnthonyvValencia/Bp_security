import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useRestablecerContrasena } from '@/src/features/auth/hooks/useRestablecerContrasena';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { EncabezadoAuth } from '@/src/shared/components/EncabezadoAuth';
import { colors } from '@/src/shared/theme/colors';

export default function RestablecerContrasenaScreen() {
  const [form, setForm] = useState({
    email: '',
    token: '',
    password: '',
    password_confirmation: '',
  });
  const { mutate, isPending, error } = useRestablecerContrasena();

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) =>
    setForm((anterior) => ({ ...anterior, [campo]: valor }));

  const mensajeError = error
    ? obtenerMensajeError(error, 'No se pudo restablecer la contraseña.')
    : null;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contenedor}
      enableOnAndroid
      extraScrollHeight={24}
    >
      <EncabezadoAuth
        icono="lock-open-outline"
        titulo="RESTABLECER CONTRASEÑA"
        subtitulo="Ingresa el código que recibiste por correo"
      />

      <Campo
        etiqueta="Correo electrónico"
        icono="mail-outline"
        value={form.email}
        onChangeText={actualizarCampo('email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Campo
        etiqueta="Código de recuperación"
        icono="key-outline"
        value={form.token}
        onChangeText={actualizarCampo('token')}
        autoCapitalize="none"
      />
      <Campo
        etiqueta="Nueva contraseña"
        value={form.password}
        onChangeText={actualizarCampo('password')}
        secureTextEntry
      />
      <Campo
        etiqueta="Confirmar nueva contraseña"
        value={form.password_confirmation}
        onChangeText={actualizarCampo('password_confirmation')}
        secureTextEntry
      />

      {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

      <Boton
        titulo="RESTABLECER CONTRASEÑA"
        cargando={isPending}
        onPress={() => mutate(form, { onSuccess: () => router.replace('/(auth)/login') })}
      />

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
