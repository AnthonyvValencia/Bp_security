import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useIniciarSesion } from '@/src/features/auth/hooks/useIniciarSesion';
import { EscudoAnimado } from '@/src/features/auth/components/EscudoAnimado';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
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
      {/* Resplandor ambiental: degradado que se disuelve hacia transparente (sin
          borde nítido) para dar profundidad sin dibujar un halo bajo el logo. */}
      <LinearGradient
        colors={[colors.acento + '1A', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.resplandorAmbiental}
        pointerEvents="none"
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        <EscudoAnimado />

        {/* Saludo de usuario que regresa: da calidez antes de pedir datos. */}
        <View style={styles.bienvenida}>
          <Text style={styles.bienvenidaTitulo}>Bienvenido de nuevo</Text>
          <Text style={styles.bienvenidaSubtitulo}>Ingresa para proteger a tu comunidad</Text>
        </View>

        {/* Tarjeta elevada con degradado sutil de superficie. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.tarjeta}
        >
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

          {/* Patrón estándar: recuperación alineada a la derecha, junto al campo. */}
          <Link href="/(auth)/olvide-contrasena" style={styles.enlaceOlvide}>
            ¿Olvidaste tu contraseña?
          </Link>
        </LinearGradient>

        <View style={styles.accionPrincipal}>
          <BotonIngresar cargando={isPending} onPress={validarYEnviar} />
        </View>

        <View style={styles.divisorContenedor}>
          <View style={styles.divisor} />
          <Text style={styles.divisorTexto}>o continuar con</Text>
          <View style={styles.divisor} />
        </View>

        <BotonGoogle />

        <Text style={styles.textoRegistro}>
          ¿No tienes cuenta?{' '}
          <Link href="/(auth)/registro" style={styles.enlaceDestacado}>
            Regístrate
          </Link>
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

/**
 * CTA principal: degradado cian de marca + resplandor propio y una micro-escala
 * al presionar. El rojo queda reservado para la emergencia (botón de pánico),
 * así el login es un momento de confianza, no de alarma.
 */
function BotonIngresar({ cargando, onPress }: { cargando: boolean; onPress: () => void }) {
  const escala = useRef(new Animated.Value(1)).current;

  const animar = (hacia: number) =>
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        disabled={cargando}
        style={styles.ctaSombra}
      >
        <LinearGradient
          colors={cargando ? [colors.textoTenue, colors.textoTenue] : ['#22E4FF', '#00A6C9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTexto}>{cargando ? 'INGRESANDO…' : 'INGRESAR'}</Text>
          {!cargando ? (
            <Ionicons name="arrow-forward" size={18} color={colors.fondo} style={styles.ctaIcono} />
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/** Inicio con Google — aún por implementar; se muestra honesto con la etiqueta "Pronto". */
function BotonGoogle() {
  return (
    <Pressable style={styles.botonGoogle} disabled>
      <Ionicons name="logo-google" size={18} color={colors.texto} />
      <Text style={styles.botonGoogleTexto}>Continuar con Google</Text>
      <View style={styles.pastillaPronto}>
        <Text style={styles.pastillaProntoTexto}>PRONTO</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  resplandorAmbiental: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  bienvenida: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bienvenidaTitulo: {
    color: colors.texto,
    fontSize: 22,
    fontWeight: '700',
  },
  bienvenidaSubtitulo: {
    color: colors.textoSecundario,
    fontSize: 13,
    marginTop: 4,
  },
  tarjeta: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 24,
    // Sombra suave tintada al fondo (no gris puro) para dar elevación.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  enlaceOlvide: {
    color: colors.acento,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  accionPrincipal: {
    marginTop: 24,
  },
  ctaSombra: {
    borderRadius: 16,
    // Resplandor cian propio del botón (glow), no una sombra gris.
    shadowColor: colors.acento,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
  },
  ctaTexto: {
    color: colors.fondo,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  ctaIcono: {
    marginLeft: 8,
  },
  divisorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  divisor: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borde,
  },
  divisorTexto: {
    color: colors.textoSecundario,
    fontSize: 11,
    marginHorizontal: 12,
  },
  botonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.social,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  botonGoogleTexto: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  pastillaPronto: {
    backgroundColor: colors.acento + '1F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pastillaProntoTexto: {
    color: colors.acento,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textoRegistro: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
  },
  enlaceDestacado: {
    color: colors.acento,
    fontWeight: '700',
  },
});
