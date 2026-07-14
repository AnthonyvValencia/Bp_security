import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import {
  useAprobarSolicitud,
  useRechazarSolicitud,
  useSolicitudesPendientes,
} from '@/src/features/communities/hooks/useMembresia';
import type { SolicitudMembresia } from '@/src/features/communities/types';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export default function SolicitudesComunidadScreen() {
  const { comunidadId } = useLocalSearchParams<{ comunidadId: string }>();
  const id = Number(comunidadId);

  const { data: solicitudes, isLoading } = useSolicitudesPendientes(id);
  const { mutate: aprobar, isPending: aprobando } = useAprobarSolicitud(id);
  const { mutate: rechazar, isPending: rechazando } = useRechazarSolicitud(id);

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Solicitudes de ingreso</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} />
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>No hay solicitudes pendientes.</Text>}
          renderItem={({ item }) => (
            <ItemSolicitud
              solicitud={item}
              cargando={aprobando || rechazando}
              onAprobar={() => aprobar(item.id)}
              onRechazar={() => rechazar({ solicitudId: item.id })}
            />
          )}
        />
      )}
    </PantallaSegura>
  );
}

function ItemSolicitud({
  solicitud,
  cargando,
  onAprobar,
  onRechazar,
}: {
  solicitud: SolicitudMembresia;
  cargando: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const usuario = solicitud.usuario;
  const direccion = [usuario?.direccion, usuario?.numero_casa].filter(Boolean).join(' · ');

  return (
    <View style={styles.item}>
      <View style={styles.encabezado}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {usuario?.nombres.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemNombre}>
            {usuario?.nombres} {usuario?.apellidos}
          </Text>
          <Text style={styles.itemFecha}>
            Solicitó unirse el {new Date(solicitud.creado_en).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.perfil}>
        <DatoPerfil icono="mail-outline" valor={usuario?.email} />
        <DatoPerfil icono="call-outline" valor={usuario?.telefono} />
        <DatoPerfil icono="location-outline" valor={usuario?.barrio} etiqueta="Barrio" />
        <DatoPerfil icono="home-outline" valor={direccion || null} etiqueta="Dirección" />
        <DatoPerfil
          icono="navigate-outline"
          valor={usuario?.referencias_domicilio}
          etiqueta="Referencias"
        />
      </View>

      <View style={styles.filaBotones}>
        <Boton titulo="Aprobar" cargando={cargando} onPress={onAprobar} style={{ flex: 1 }} />
        <Boton
          titulo="Rechazar"
          variante="secundario"
          cargando={cargando}
          onPress={onRechazar}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function DatoPerfil({
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
    padding: 24,
    backgroundColor: colors.fondo,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    backgroundColor: colors.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 16,
    marginBottom: 12,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: colors.texto,
    fontSize: 17,
    fontWeight: '700',
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.texto,
  },
  itemFecha: {
    fontSize: 12,
    color: colors.textoTenue,
    marginTop: 2,
  },
  perfil: {
    gap: 6,
    backgroundColor: colors.superficieAlterna + '66',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  datoTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.texto,
    lineHeight: 18,
  },
  datoEtiqueta: {
    color: colors.textoSecundario,
    fontWeight: '600',
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
  },
});
