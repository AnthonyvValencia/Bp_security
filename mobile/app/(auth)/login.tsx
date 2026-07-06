import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useIniciarSesion } from '@/src/features/auth/hooks/useIniciarSesion';
import { EscudoAnimado } from '@/src/features/auth/components/EscudoAnimado';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { FondoCuadricula } from '@/src/shared/components/FondoCuadricula';
import { colors } from '@/src/shared/theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const { mutate, isPending, error, reset } = useIniciarSesion();

  const mensajeErrorApi = error
    ? obtenerMensajeError(error, 'No se pudo iniciar sesión. Verifica tus datos.')
    : null;

  const validarYEnviar = () => {
    reset();
    let valido = true;

    if (email.trim().length === 0) {
      setErrorEmail('Ingresa tu correo electrónico');
      valido = false;
    } else {
      setErrorEmail('');
    }

    if (password.length === 0) {
      setErrorPassword('Ingresa tu contraseña');
      valido = false;
    } else if (password.length < 6) {
      setErrorPassword('Mínimo 6 caracteres');
      valido = false;
    } else {
      setErrorPassword('');
    }

    if (!valido) return;

    mutate({ email: email.trim(), password }, { onSuccess: () => router.replace('/(app)') });
  };

  return (
    <View style={styles.raiz}>
      <FondoCuadricula />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        <EscudoAnimado />

        <View style={styles.tarjeta}>
          <Campo
            etiqueta="Correo electrónico"
            icono="mail-outline"
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              setErrorEmail('');
              reset();
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="admin@bp.com"
            error={errorEmail}
          />
          <Campo
            etiqueta="Contraseña"
            icono="lock-closed-outline"
            value={password}
            onChangeText={(valor) => {
              setPassword(valor);
              setErrorPassword('');
              reset();
            }}
            secureTextEntry
            placeholder="••••••••"
            error={errorPassword || (mensajeErrorApi ?? '')}
          />
        </View>

        <View style={styles.espacioTarjetaBoton} />

        <Boton titulo="INGRESAR" cargando={isPending} onPress={validarYEnviar} />

        <Link href="/(auth)/olvide-contrasena" style={styles.enlace}>
          ¿Olvidaste tu contraseña?
        </Link>
        <Text style={styles.textoRegistro}>
          ¿No tienes cuenta?{' '}
          <Link href="/(auth)/registro" style={styles.enlaceDestacado}>
            Regístrate
          </Link>
        </Text>

        <View style={styles.divisorContenedor}>
          <View style={styles.divisor} />
          <Text style={styles.divisorTexto}>o continuar con</Text>
          <View style={styles.divisor} />
        </View>

        <View style={styles.filaSocial}>
          <BotonSocial titulo="Google" />
          <BotonSocial titulo="Cédula" />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function BotonSocial({ titulo }: { titulo: string }) {
  return (
    <Pressable style={styles.botonSocial} disabled>
      <Text style={styles.botonSocialTexto}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 20,
  },
  espacioTarjetaBoton: {
    height: 18,
  },
  enlace: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
  },
  textoRegistro: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
  enlaceDestacado: {
    color: colors.acento,
    fontWeight: '700',
  },
  divisorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  divisor: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borde,
  },
  divisorTexto: {
    color: colors.textoSecundario,
    fontSize: 10,
    marginHorizontal: 10,
  },
  filaSocial: {
    flexDirection: 'row',
    gap: 12,
  },
  botonSocial: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.social,
    borderWidth: 1,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSocialTexto: {
    color: colors.texto,
    fontSize: 13,
    fontWeight: '600',
  },
});
