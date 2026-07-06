import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/store/authStore';
import {
  useComunidad,
  useMiComunidad,
  useSolicitarIngreso,
} from '@/src/features/communities/hooks/useComunidades';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function DetalleComunidadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comunidadId = Number(id);
  const usuario = useAuthStore((state) => state.usuario);

  const { data: comunidad, isLoading } = useComunidad(comunidadId);
  const { data: miComunidad } = useMiComunidad();
  const { mutate: solicitarIngreso, isPending } = useSolicitarIngreso();

  if (isLoading || !comunidad) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  const esLider = comunidad.lider?.id === usuario?.id;
  const yaTieneComunidad = Boolean(miComunidad);

  const solicitar = () => {
    solicitarIngreso(comunidadId, {
      onSuccess: () => {
        Alert.alert('Solicitud enviada', 'El líder de la comunidad revisará tu solicitud.');
      },
      onError: (error) => {
        Alert.alert('No se pudo enviar', obtenerMensajeError(error, 'Intenta de nuevo.'));
      },
    });
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>{comunidad.nombre}</Text>
      <Text style={styles.barrio}>{comunidad.barrio}</Text>

      {comunidad.descripcion ? (
        <Text style={styles.descripcion}>{comunidad.descripcion}</Text>
      ) : null}

      <View style={styles.tarjeta}>
        <View style={styles.fila}>
          <Ionicons name="person-outline" size={16} color={colors.textoSecundario} />
          <Text style={styles.filaTexto}>
            Líder:{' '}
            {comunidad.lider ? `${comunidad.lider.nombres} ${comunidad.lider.apellidos}` : '—'}
          </Text>
        </View>
        <View style={styles.fila}>
          <Ionicons name="people-outline" size={16} color={colors.textoSecundario} />
          <Text style={styles.filaTexto}>{comunidad.total_miembros ?? 0} miembros</Text>
        </View>
      </View>

      {esLider ? (
        <>
          <Link
            href={`/(app)/communities/requests?comunidadId=${comunidad.id}`}
            style={styles.enlace}
          >
            Gestionar solicitudes de ingreso
          </Link>
          <Link
            href={`/(app)/communities/members?comunidadId=${comunidad.id}`}
            style={styles.enlace}
          >
            Gestionar miembros
          </Link>
        </>
      ) : !yaTieneComunidad ? (
        <Boton titulo="Solicitar unirme" cargando={isPending} onPress={solicitar} />
      ) : (
        <Text style={styles.aviso}>Ya perteneces a una comunidad.</Text>
      )}
    </PantallaSegura>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  barrio: {
    fontSize: 14,
    color: colors.textoSecundario,
    textAlign: 'center',
    marginBottom: 12,
  },
  descripcion: {
    fontSize: 14,
    color: colors.texto,
    textAlign: 'center',
    marginBottom: 16,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filaTexto: {
    color: colors.texto,
    fontSize: 14,
  },
  enlace: {
    color: colors.acento,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  aviso: {
    color: colors.textoSecundario,
    textAlign: 'center',
  },
});
