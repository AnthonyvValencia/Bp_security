import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useContactosEmergencia } from '@/src/features/profile/hooks/useContactosEmergencia';
import { Boton } from '@/src/shared/components/Boton';
import { colors } from '@/src/shared/theme/colors';

interface Props {
  latitud: number | null;
  longitud: number | null;
}

function construirMensaje(nombre: string, latitud: number | null, longitud: number | null): string {
  const base = `EMERGENCIA: soy ${nombre}. Necesito ayuda.`;

  if (latitud === null || longitud === null) {
    return `${base} No pude obtener mi ubicación.`;
  }

  return `${base} Mi ubicación: https://www.google.com/maps?q=${latitud},${longitud}`;
}

/**
 * Las dos vías de ayuda que no dependen de tener vecinos: el ECU 911 y los
 * contactos de emergencia del propio usuario. El SMS sale del móvil del
 * ciudadano (no del backend), así que no cuesta nada y viaja por red celular
 * aunque no haya datos.
 */
export function EscaladaEmergencia({ latitud, longitud }: Props) {
  const usuario = useAuthStore((state) => state.usuario);
  const { data: contactos } = useContactosEmergencia();

  const llamar = (numero: string) => void Linking.openURL(`tel:${numero}`);

  const avisarContactos = () => {
    if (!contactos || contactos.length === 0) {
      return;
    }

    const numeros = contactos.map((contacto) => contacto.telefono).join(',');
    const cuerpo = encodeURIComponent(
      construirMensaje(usuario?.nombres ?? 'un vecino', latitud, longitud),
    );
    // El separador del cuerpo cambia por plataforma: Android usa '?', iOS '&'.
    const separador = Platform.OS === 'ios' ? '&' : '?';

    Linking.openURL(`sms:${numeros}${separador}body=${cuerpo}`).catch(() =>
      Alert.alert(
        'No se pudo abrir mensajes',
        'Tu dispositivo no permitió abrir la app de mensajes. Llama directamente a tus contactos.',
      ),
    );
  };

  const sinContactos = !contactos || contactos.length === 0;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>AYUDA INMEDIATA</Text>

      <Boton titulo="Llamar al ECU 911" onPress={() => llamar('911')} />

      {sinContactos ? (
        <Text
          style={styles.enlace}
          onPress={() => router.push('/(app)/perfil/contactos-emergencia')}
        >
          No tienes contactos de emergencia. Toca aquí para añadirlos.
        </Text>
      ) : (
        <>
          <Boton titulo="Avisar a mis contactos" variante="secundario" onPress={avisarContactos} />

          <View style={styles.lista}>
            {contactos.map((contacto) => (
              <View key={contacto.id} style={styles.fila}>
                <View style={styles.filaTextos}>
                  <Text style={styles.nombre}>{contacto.nombre}</Text>
                  <Text style={styles.meta}>
                    {contacto.parentesco ? `${contacto.parentesco} · ` : ''}
                    {contacto.telefono}
                  </Text>
                </View>

                <Ionicons
                  name="call"
                  size={20}
                  color={colors.acento}
                  onPress={() => llamar(contacto.telefono)}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  titulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acento,
    letterSpacing: 1,
    textAlign: 'center',
  },
  enlace: {
    color: colors.acento,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  lista: {
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.superficieAlterna,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filaTextos: {
    flexShrink: 1,
  },
  nombre: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: colors.textoSecundario,
    fontSize: 12,
    marginTop: 2,
  },
});
