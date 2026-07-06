import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { useExpulsarMiembro, useMiembros } from '@/src/features/communities/hooks/useMembresia';
import type { ComunidadMiembro } from '@/src/features/communities/types';
import { Boton } from '@/src/shared/components/Boton';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function MiembrosComunidadScreen() {
  const { comunidadId } = useLocalSearchParams<{ comunidadId: string }>();
  const id = Number(comunidadId);

  const { data: miembros, isLoading } = useMiembros(id);
  const { mutate: expulsar, isPending } = useExpulsarMiembro(id);

  const confirmarExpulsion = (miembro: ComunidadMiembro) => {
    Alert.alert(
      'Expulsar miembro',
      `¿Seguro que quieres expulsar a ${miembro.usuario.nombres} ${miembro.usuario.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Expulsar', style: 'destructive', onPress: () => expulsar(miembro.id) },
      ],
    );
  };

  return (
    <PantallaSegura style={styles.contenedor}>
      <Text style={styles.titulo}>Miembros de la comunidad</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.acento} />
      ) : (
        <FlatList
          data={miembros}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.vacio}>Aún no hay miembros.</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View>
                <Text style={styles.itemNombre}>
                  {item.usuario.nombres} {item.usuario.apellidos}
                </Text>
                <Text style={styles.itemDetalle}>{item.usuario.telefono}</Text>
              </View>
              <Boton
                titulo="Expulsar"
                variante="secundario"
                cargando={isPending}
                onPress={() => confirmarExpulsion(item)}
              />
            </View>
          )}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.texto,
  },
  itemDetalle: {
    fontSize: 13,
    color: colors.textoSecundario,
  },
});
