import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { EscudoAnimado } from '@/src/features/auth/components/EscudoAnimado';
import { useRegistro } from '@/src/features/auth/hooks/useRegistro';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { FondoCuadricula } from '@/src/shared/components/FondoCuadricula';
import { TituloSeccion } from '@/src/shared/components/TituloSeccion';
import { useUbicacionActual } from '@/src/shared/hooks/useUbicacionActual';
import { colors } from '@/src/shared/theme/colors';

export default function RegistroScreen() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    email: '',
    password: '',
    password_confirmation: '',
    telefono: '',
    direccion: '',
    barrio: '',
    numero_casa: '',
  });

  const {
    coordenadas,
    cargando: cargandoUbicacion,
    error: errorUbicacion,
    capturarUbicacion,
  } = useUbicacionActual();
  const { mutate, isPending, error } = useRegistro();

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) =>
    setForm((anterior) => ({ ...anterior, [campo]: valor }));

  const mensajeError = error
    ? obtenerMensajeError(error, 'Revisa los datos ingresados e intenta de nuevo.')
    : null;

  const enviar = () => {
    mutate(
      {
        ...form,
        latitud: coordenadas?.latitud ?? null,
        longitud: coordenadas?.longitud ?? null,
      },
      {
        onSuccess: () => {
          Alert.alert('Éxito', 'Te registraste correctamente', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') },
          ]);
        },
      },
    );
  };

  return (
    <View style={styles.raiz}>
      <FondoCuadricula />
      {/* Resplandor ambiental: mismo degradado disuelto del login para dar
          continuidad visual entre pantallas de autenticación. */}
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

        {/* Invitación al nuevo usuario: da contexto antes de pedir tantos datos. */}
        <View style={styles.bienvenida}>
          <Text style={styles.bienvenidaTitulo}>Crea tu cuenta</Text>
          <Text style={styles.bienvenidaSubtitulo}>Únete y protege a tu comunidad</Text>
        </View>

        {/* Tarjeta 1 — datos personales, con degradado sutil de superficie. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.tarjeta}
        >
          <TituloSeccion icono="person-outline" titulo="Datos personales" />

          <Campo
            etiqueta="Nombres"
            icono="person-outline"
            value={form.nombres}
            onChangeText={actualizarCampo('nombres')}
            placeholder="Juan Carlos"
          />
          <Campo
            etiqueta="Apellidos"
            icono="people-outline"
            value={form.apellidos}
            onChangeText={actualizarCampo('apellidos')}
            placeholder="Pérez Gómez"
          />
          <Campo
            etiqueta="Cédula de identidad"
            icono="card-outline"
            value={form.cedula}
            onChangeText={actualizarCampo('cedula')}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="0912345678"
          />
          <Campo
            etiqueta="Teléfono"
            icono="call-outline"
            value={form.telefono}
            onChangeText={actualizarCampo('telefono')}
            maxLength={10}
            keyboardType="phone-pad"
            placeholder="0987654321"
          />
          <Campo
            etiqueta="Dirección"
            icono="location-outline"
            value={form.direccion}
            onChangeText={actualizarCampo('direccion')}
            placeholder="Calle 13 y Av. 5"
          />
          <Campo
            etiqueta="Barrio"
            icono="home-outline"
            value={form.barrio}
            onChangeText={actualizarCampo('barrio')}
            placeholder="La Paz"
          />
          <Campo
            etiqueta="Número de casa"
            icono="business-outline"
            value={form.numero_casa}
            onChangeText={actualizarCampo('numero_casa')}
            placeholder="N-45"
          />

          <View style={styles.bloqueUbicacion}>
            <Text style={styles.etiquetaUbicacion}>UBICACIÓN DEL DOMICILIO (OPCIONAL)</Text>
            <Boton
              titulo={coordenadas ? 'Ubicación capturada ✓' : 'Capturar mi ubicación'}
              variante="secundario"
              cargando={cargandoUbicacion}
              onPress={capturarUbicacion}
            />
            {errorUbicacion ? <Text style={styles.error}>{errorUbicacion}</Text> : null}
          </View>
        </LinearGradient>

        {/* Tarjeta 2 — credenciales de acceso. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.tarjeta, styles.tarjetaSecundaria]}
        >
          <TituloSeccion icono="lock-closed-outline" titulo="Datos de acceso" />

          <Campo
            etiqueta="Correo electrónico"
            icono="mail-outline"
            value={form.email}
            onChangeText={actualizarCampo('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
          />
          <Campo
            etiqueta="Contraseña"
            icono="lock-closed-outline"
            value={form.password}
            onChangeText={actualizarCampo('password')}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
          />
          <Campo
            etiqueta="Confirmar contraseña"
            icono="lock-closed-outline"
            value={form.password_confirmation}
            onChangeText={actualizarCampo('password_confirmation')}
            secureTextEntry
            placeholder="Repite tu contraseña"
          />
        </LinearGradient>

        {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

        <View style={styles.accionPrincipal}>
          <BotonRegistrar cargando={isPending} onPress={enviar} />
        </View>

        <Text style={styles.textoLogin}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/(auth)/login" style={styles.enlaceDestacado}>
            Inicia sesión
          </Link>
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

/**
 * CTA principal: mismo degradado cian de marca, resplandor propio y micro-escala
 * al presionar que el botón "INGRESAR" del login, para que ambas pantallas de
 * autenticación se sientan de la misma familia.
 */
function BotonRegistrar({ cargando, onPress }: { cargando: boolean; onPress: () => void }) {
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
          <Text style={styles.ctaTexto}>{cargando ? 'CREANDO CUENTA…' : 'REGISTRARME'}</Text>
          {!cargando ? (
            <Ionicons name="arrow-forward" size={18} color={colors.fondo} style={styles.ctaIcono} />
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
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
  tarjetaSecundaria: {
    marginTop: 16,
  },
  bloqueUbicacion: {
    marginTop: 4,
  },
  etiquetaUbicacion: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textoSecundario,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  error: {
    color: colors.peligro,
    marginTop: 12,
    textAlign: 'center',
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
  textoLogin: {
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
