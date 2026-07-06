import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
  useContactosEmergencia,
  useCrearContactoEmergencia,
  useEliminarContactoEmergencia,
} from '@/src/features/profile/hooks/useContactosEmergencia';
import { Boton } from '@/src/shared/components/Boton';
import { Campo } from '@/src/shared/components/Campo';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

export default function ContactosEmergenciaScreen() {
  const { data: contactos, isLoading } = useContactosEmergencia();
  const { mutate: crear, isPending: creando } = useCrearContactoEmergencia();
  const { mutate: eliminar } = useEliminarContactoEmergencia();

  const [form, setForm] = useState({ nombre: '', telefono: '', parentesco: '' });

  const actualizarCampo = (campo: keyof typeof form) => (valor: string) =>
    setForm((anterior) => ({ ...anterior, [campo]: valor }));

  return (
    <PantallaSegura>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contenedor}
        enableOnAndroid
        extraScrollHeight={24}
      >
        <Text style={styles.titulo}>Contactos de emergencia</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.acento} />
        ) : (
          <FlatList
            data={contactos}
            keyExtractor={(item) => String(item.id)}
            style={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vacio}>Aún no tienes contactos agregados.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View>
                  <Text style={styles.itemNombre}>{item.nombre}</Text>
                  <Text style={styles.itemDetalle}>
                    {item.telefono} {item.parentesco ? `· ${item.parentesco}` : ''}
                  </Text>
                </View>
                <Boton titulo="Eliminar" variante="secundario" onPress={() => eliminar(item.id)} />
              </View>
            )}
          />
        )}

        <Text style={styles.subtitulo}>Agregar nuevo contacto</Text>
        <Campo etiqueta="Nombre" value={form.nombre} onChangeText={actualizarCampo('nombre')} />
        <Campo
          etiqueta="Teléfono"
          value={form.telefono}
          onChangeText={actualizarCampo('telefono')}
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="Parentesco"
          value={form.parentesco}
          onChangeText={actualizarCampo('parentesco')}
        />

        <Boton
          titulo="Agregar contacto"
          cargando={creando}
          onPress={() =>
            crear(form, { onSuccess: () => setForm({ nombre: '', telefono: '', parentesco: '' }) })
          }
        />
      </KeyboardAwareScrollView>
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
  subtitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoSecundario,
    marginBottom: 12,
    marginTop: 8,
  },
  lista: {
    maxHeight: 240,
    marginBottom: 8,
  },
  vacio: {
    color: colors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
