import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAdminDashboard } from '@/src/features/admin/hooks/useAdmin';
import type { AuditoriaEntrada } from '@/src/features/admin/types';
import { useCerrarSesion } from '@/src/features/auth/hooks/useCerrarSesion';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { AccionRapida } from '@/src/shared/components/AccionRapida';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export function PanelAdmin() {
  const usuario = useAuthStore((state) => state.usuario);
  const { mutate: cerrarSesion } = useCerrarSesion();
  const { data: resumen, isLoading, isFetching, refetch } = useAdminDashboard();

  return (
    <PantallaSegura>
      <ScrollView
        contentContainerStyle={styles.contenedor}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.acento} />
        }
      >
        <View style={styles.encabezado}>
          <View style={styles.avatar}>
            <Ionicons name="shield-half" size={22} color={colors.acento} />
          </View>
          <View style={styles.encabezadoTextos}>
            <Text style={styles.saludo}>Panel de administración</Text>
            <Text style={styles.subtitulo}>
              {usuario?.nombres} {usuario?.apellidos}
            </Text>
          </View>
          <Text
            style={styles.cerrarSesion}
            onPress={() => cerrarSesion(undefined, { onSuccess: () => router.replace('/(auth)/login') })}
          >
            CERRAR SESIÓN
          </Text>
        </View>

        {isLoading || !resumen ? (
          <ActivityIndicator size="large" color={colors.acento} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.seccionTitulo}>USUARIOS</Text>
            <View style={styles.grid}>
              <Kpi icono="people" valor={resumen.usuarios.total} etiqueta="Total" />
              <Kpi
                icono="ban"
                valor={resumen.usuarios.suspendidos}
                etiqueta="Suspendidos"
                alerta={resumen.usuarios.suspendidos > 0}
              />
              <Kpi icono="shield-checkmark" valor={resumen.usuarios.administradores} etiqueta="Admins" />
              <Kpi icono="star" valor={resumen.usuarios.lideres} etiqueta="Líderes" />
              <Kpi icono="person" valor={resumen.usuarios.ciudadanos} etiqueta="Ciudadanos" />
            </View>

            <Text style={styles.seccionTitulo}>COMUNIDADES</Text>
            <View style={styles.grid}>
              <Kpi icono="home" valor={resumen.comunidades.activas} etiqueta="Activas" />
              <Kpi
                icono="pause-circle"
                valor={resumen.comunidades.suspendidas}
                etiqueta="Suspendidas"
                alerta={resumen.comunidades.suspendidas > 0}
              />
              <Kpi
                icono="hourglass"
                valor={resumen.comunidades.pendientes}
                etiqueta="Pendientes"
                alerta={resumen.comunidades.pendientes > 0}
              />
            </View>

            <Text style={styles.seccionTitulo}>ACTIVIDAD</Text>
            <View style={styles.grid}>
              <Kpi icono="alert-circle" valor={resumen.actividad.alertas} etiqueta="Alertas de pánico" />
              <Kpi icono="document-text" valor={resumen.actividad.reportes} etiqueta="Reportes" />
            </View>

            <Text style={styles.seccionTitulo}>GESTIÓN</Text>
            <View style={styles.grid}>
              <AccionRapida
                icono="people-circle-outline"
                titulo="Gestión de usuarios"
                onPress={() => router.push('/(app)/admin/users')}
              />
              <AccionRapida
                icono="checkmark-done-outline"
                titulo="Gestión de comunidades"
                onPress={() => router.push('/(app)/admin/communities-management')}
              />
            </View>

            <Text style={styles.seccionTitulo}>ACTIVIDAD RECIENTE</Text>
            {resumen.auditoria_reciente.length === 0 ? (
              <Text style={styles.vacio}>Sin actividad registrada.</Text>
            ) : (
              <View style={styles.feed}>
                {resumen.auditoria_reciente.map((entrada) => (
                  <FilaAuditoria key={entrada.id} entrada={entrada} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </PantallaSegura>
  );
}

function Kpi({
  icono,
  valor,
  etiqueta,
  alerta,
}: {
  icono: NombreIcono;
  valor: number;
  etiqueta: string;
  alerta?: boolean;
}) {
  return (
    <View style={styles.kpi}>
      <Ionicons name={icono} size={20} color={alerta ? colors.peligro : colors.acento} />
      <Text style={[styles.kpiValor, alerta ? styles.kpiValorAlerta : null]}>{valor}</Text>
      <Text style={styles.kpiEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const DESCRIPCION_ACCION: Record<string, { texto: string; icono: NombreIcono }> = {
  inicio_sesion: { texto: 'Inició sesión', icono: 'log-in-outline' },
  inicio_sesion_fallido: { texto: 'Intento de login fallido', icono: 'warning-outline' },
  inicio_sesion_bloqueado: { texto: 'Login bloqueado (suspendido)', icono: 'lock-closed-outline' },
  cierre_sesion: { texto: 'Cerró sesión', icono: 'log-out-outline' },
  usuario_registrado: { texto: 'Nuevo registro', icono: 'person-add-outline' },
  usuario_suspendido: { texto: 'Usuario suspendido', icono: 'ban-outline' },
  usuario_reactivado: { texto: 'Usuario reactivado', icono: 'checkmark-circle-outline' },
  rol_usuario_cambiado: { texto: 'Cambio de rol', icono: 'swap-horizontal-outline' },
  comunidad_solicitada: { texto: 'Solicitud de comunidad', icono: 'add-circle-outline' },
  comunidad_aprobada: { texto: 'Comunidad aprobada', icono: 'checkmark-done-outline' },
  comunidad_rechazada: { texto: 'Comunidad rechazada', icono: 'close-circle-outline' },
  comunidad_suspendida: { texto: 'Comunidad suspendida', icono: 'pause-circle-outline' },
  comunidad_reactivada: { texto: 'Comunidad reactivada', icono: 'play-circle-outline' },
  comunidad_eliminada: { texto: 'Comunidad eliminada', icono: 'trash-outline' },
  lider_cambiado: { texto: 'Cambio de líder', icono: 'star-outline' },
  miembro_expulsado: { texto: 'Miembro expulsado', icono: 'person-remove-outline' },
};

function describirAccion(accion: string): { texto: string; icono: NombreIcono } {
  return (
    DESCRIPCION_ACCION[accion] ?? {
      texto: accion.replace(/_/g, ' '),
      icono: 'ellipse-outline',
    }
  );
}

function FilaAuditoria({ entrada }: { entrada: AuditoriaEntrada }) {
  const { texto, icono } = describirAccion(entrada.accion);
  const quien = entrada.usuario
    ? `${entrada.usuario.nombres} ${entrada.usuario.apellidos}`
    : 'Sistema';

  return (
    <View style={styles.filaAuditoria}>
      <Ionicons name={icono} size={16} color={colors.textoSecundario} />
      <View style={{ flex: 1 }}>
        <Text style={styles.auditoriaTexto}>{texto}</Text>
        <Text style={styles.auditoriaMeta}>
          {quien} · {new Date(entrada.creado_en).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: colors.fondo,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  encabezadoTextos: {
    flex: 1,
  },
  saludo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.texto,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textoSecundario,
    marginTop: 2,
  },
  cerrarSesion: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.peligro,
    letterSpacing: 0.5,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acento,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpi: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    paddingVertical: 16,
  },
  kpiValor: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.texto,
  },
  kpiValorAlerta: {
    color: colors.peligro,
  },
  kpiEtiqueta: {
    fontSize: 11,
    color: colors.textoSecundario,
    textAlign: 'center',
  },
  feed: {
    gap: 4,
  },
  filaAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  auditoriaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.texto,
    textTransform: 'capitalize',
  },
  auditoriaMeta: {
    fontSize: 11,
    color: colors.textoTenue,
    marginTop: 1,
  },
  vacio: {
    color: colors.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
