import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePerfil } from '@/src/features/profile/hooks/usePerfil';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function VerPerfilScreen() {
  const { data: usuario, isLoading, error } = usePerfil();

  if (isLoading) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  if (error || !usuario) {
    return (
      <PantallaSegura style={styles.centrado}>
        <Text style={styles.error}>No se pudo cargar tu perfil.</Text>
      </PantallaSegura>
    );
  }

  return (
    <PantallaSegura>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{usuario.nombres.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.titulo}>
          {usuario.nombres} {usuario.apellidos}
        </Text>
        <Text style={styles.subtitulo}>{usuario.email}</Text>

        <View style={styles.tarjeta}>
          <Dato etiqueta="Cédula" valor={usuario.cedula} />
          <Dato etiqueta="Teléfono" valor={usuario.telefono} />
          <Dato
            etiqueta="Dirección"
            valor={`${usuario.direccion}, ${usuario.barrio} #${usuario.numero_casa}`}
          />
          <Dato etiqueta="Referencias" valor={usuario.referencias_domicilio ?? 'No especificado'} />
          <Dato etiqueta="Tipo de sangre" valor={usuario.tipo_sangre ?? 'No especificado'} />
          <Dato etiqueta="Condiciones médicas" valor={usuario.condiciones_medicas ?? 'Ninguna'} />
        </View>

        <Link href="/(app)/perfil/editar" style={styles.enlaceFila}>
          <Ionicons name="create-outline" size={18} color={colors.acento} />
          <Text style={styles.enlaceTexto}>Editar mi perfil</Text>
        </Link>
        <Link href="/(app)/perfil/contactos-emergencia" style={styles.enlaceFila}>
          <Ionicons name="people-outline" size={18} color={colors.acento} />
          <Text style={styles.enlaceTexto}>
            Contactos de emergencia ({usuario.contactos_emergencia?.length ?? 0})
          </Text>
        </Link>
      </ScrollView>
    </PantallaSegura>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.etiquetaDato}>{etiqueta.toUpperCase()}</Text>
      <Text style={styles.valorDato}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
    alignItems: 'center',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTexto: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.texto,
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
    marginBottom: 20,
  },
  tarjeta: {
    width: '100%',
    backgroundColor: colors.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 18,
    marginBottom: 20,
  },
  dato: {
    marginBottom: 14,
  },
  etiquetaDato: {
    fontSize: 11,
    color: colors.textoTenue,
    letterSpacing: 0.5,
  },
  valorDato: {
    fontSize: 15,
    color: colors.texto,
    marginTop: 2,
  },
  enlaceFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  enlaceTexto: {
    color: colors.texto,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.peligro,
  },
});
