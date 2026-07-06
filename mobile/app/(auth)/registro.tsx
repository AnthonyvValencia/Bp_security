import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useRegistro } from '@/src/features/auth/hooks/useRegistro';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { EncabezadoAuth } from '@/src/shared/components/EncabezadoAuth';
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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contenedor}
      enableOnAndroid
      extraScrollHeight={24}
    >
      <EncabezadoAuth icono="person-add" titulo="CREAR CUENTA" subtitulo="BP SECURITY · REGISTRO" />

      <TituloSeccion icono="person-outline" titulo="Datos personales" />

      <Campo
        etiqueta="Nombres"
        value={form.nombres}
        onChangeText={actualizarCampo('nombres')}
        placeholder="Juan Carlos"
      />
      <Campo
        etiqueta="Apellidos"
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
        value={form.barrio}
        onChangeText={actualizarCampo('barrio')}
        placeholder="La Paz"
      />
      <Campo
        etiqueta="Número de casa"
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
        value={form.password}
        onChangeText={actualizarCampo('password')}
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
      />
      <Campo
        etiqueta="Confirmar contraseña"
        value={form.password_confirmation}
        onChangeText={actualizarCampo('password_confirmation')}
        secureTextEntry
        placeholder="Repite tu contraseña"
      />

      {mensajeError ? <Text style={styles.error}>{mensajeError}</Text> : null}

      <Boton titulo="REGISTRARME" cargando={isPending} onPress={enviar} />

      <Link href="/(auth)/login" style={styles.enlace}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  bloqueUbicacion: {
    marginBottom: 8,
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
    marginTop: 8,
    textAlign: 'center',
  },
  enlace: {
    color: colors.textoSecundario,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
});
