import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  useAdminUsuario,
  useCambiarRolUsuario,
  useReactivarUsuario,
  useSuspenderUsuario,
} from '@/src/features/admin/hooks/useAdmin';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { obtenerMensajeError } from '@/src/shared/api/obtenerMensajeError';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export default function DetalleUsuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const usuarioId = Number(id);

  const admin = useAuthStore((state) => state.usuario);
  const { data: usuario, isLoading } = useAdminUsuario(usuarioId);
  const { mutate: suspender, isPending: suspendiendo } = useSuspenderUsuario(usuarioId);
  const { mutate: reactivar, isPending: reactivando } = useReactivarUsuario(usuarioId);
  const { mutate: cambiarRol, isPending: cambiandoRol } = useCambiarRolUsuario(usuarioId);

  if (isLoading || !usuario) {
    return (
      <PantallaSegura style={styles.centrado}>
        <ActivityIndicator size="large" color={colors.acento} />
      </PantallaSegura>
    );
  }

  const esYoMismo = usuario.id === admin?.id;
  const suspendido = usuario.estado === 'suspendido';
  const esAdmin = usuario.rol === 'administrador';
  const cargando = suspendiendo || reactivando || cambiandoRol;
  const direccion = [usuario.direccion, usuario.numero_casa].filter(Boolean).join(' · ');

  const alError = (error: unknown) =>
    Alert.alert('No se pudo completar', obtenerMensajeError(error, 'Intenta de nuevo.'));

  const confirmarSuspender = () => {
    Alert.alert(
      'Suspender usuario',
      `¿Suspender a ${usuario.nombres} ${usuario.apellidos}? Se cerrará su sesión y no podrá volver a iniciar sesión hasta reactivarlo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => suspender(undefined, { onError: alError }),
        },
      ],
    );
  };

  const confirmarCambioRol = () => {
    const nuevoRol = esAdmin ? 'ciudadano' : 'administrador';
    const mensaje = esAdmin
      ? `¿Quitar el rol de administrador a ${usuario.nombres}? Pasará a ser ciudadano.`
      : `¿Promover a ${usuario.nombres} a administrador? Tendrá control total del sistema.`;

    Alert.alert('Cambiar rol', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: esAdmin ? 'Quitar admin' : 'Promover',
        onPress: () => cambiarRol(nuevoRol, { onError: alError }),
      },
    ]);
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarGrande}>
          <Text style={styles.avatarGrandeTexto}>{usuario.nombres.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.nombre}>
          {usuario.nombres} {usuario.apellidos}
        </Text>

        <View style={styles.badges}>
          <Text style={styles.badgeRol}>{usuario.rol}</Text>
          <Text style={[styles.badgeEstado, suspendido ? styles.badgeSuspendido : styles.badgeActivo]}>
            {usuario.estado}
          </Text>
        </View>

        <View style={styles.perfil}>
          <Dato icono="mail-outline" valor={usuario.email} />
          <Dato icono="call-outline" valor={usuario.telefono} />
          <Dato icono="card-outline" valor={usuario.cedula} etiqueta="Cédula" />
          <Dato icono="location-outline" valor={usuario.barrio} etiqueta="Barrio" />
          <Dato icono="home-outline" valor={direccion || null} etiqueta="Dirección" />
          <Dato icono="navigate-outline" valor={usuario.referencias_domicilio} etiqueta="Referencias" />
          <Dato
            icono="people-outline"
            valor={usuario.comunidad?.nombre ?? null}
            etiqueta="Comunidad"
          />
        </View>

        {esYoMismo ? (
          <Text style={styles.nota}>Esta es tu propia cuenta: no puedes suspenderla ni cambiar su rol.</Text>
        ) : (
          <View style={styles.acciones}>
            {suspendido ? (
              <Boton
                titulo="Reactivar usuario"
                cargando={cargando}
                onPress={() => reactivar(undefined, { onError: alError })}
              />
            ) : (
              <Boton titulo="Suspender usuario" variante="secundario" cargando={cargando} onPress={confirmarSuspender} />
            )}

            <Boton
              titulo={esAdmin ? 'Quitar rol de administrador' : 'Promover a administrador'}
              variante="secundario"
              cargando={cargando}
              onPress={confirmarCambioRol}
            />
          </View>
        )}
      </ScrollView>
    </PantallaSegura>
  );
}

function Dato({
  icono,
  valor,
  etiqueta,
}: {
  icono: NombreIcono;
  valor?: string | null;
  etiqueta?: string;
}) {
  if (!valor) {
    return null;
  }

  return (
    <View style={styles.dato}>
      <Ionicons name={icono} size={14} color={colors.acento} />
      <Text style={styles.datoTexto}>
        {etiqueta ? <Text style={styles.datoEtiqueta}>{etiqueta}: </Text> : null}
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fondo,
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  avatarGrande: {
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
  avatarGrandeTexto: {
    color: colors.texto,
    fontSize: 30,
    fontWeight: '700',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  badgeRol: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.acento,
    backgroundColor: colors.superficieAlterna,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  badgeEstado: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  badgeActivo: {
    color: colors.exito,
    backgroundColor: colors.superficieAlterna,
  },
  badgeSuspendido: {
    color: colors.peligro,
    backgroundColor: colors.superficieAlterna,
  },
  perfil: {
    width: '100%',
    gap: 10,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  datoTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.texto,
    lineHeight: 19,
  },
  datoEtiqueta: {
    color: colors.textoSecundario,
    fontWeight: '600',
  },
  acciones: {
    width: '100%',
    gap: 12,
  },
  nota: {
    color: colors.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
