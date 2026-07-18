import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAdminDashboard } from '@/src/features/admin/hooks/useAdmin';
import type { AuditoriaEntrada } from '@/src/features/admin/types';
import { useCerrarSesion } from '@/src/features/auth/hooks/useCerrarSesion';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { AccionRapida } from '@/src/shared/components/AccionRapida';
import { FondoCuadricula } from '@/src/shared/components/FondoCuadricula';
import { PantallaSegura } from '@/src/shared/components/PantallaSegura';
import { TituloSeccion } from '@/src/shared/components/TituloSeccion';
import { colors } from '@/src/shared/theme/colors';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

/** Tiempo relativo compacto para el feed de auditoría ("hace 5 min"). */
function tiempoRelativo(fecha: string): string {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);

  if (minutos < 1) {
    return 'hace un momento';
  }

  if (minutos < 60) {
    return `hace ${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `hace ${horas} h`;
  }

  const dias = Math.floor(horas / 24);

  if (dias < 7) {
    return `hace ${dias} día(s)`;
  }

  return new Date(fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

export function PanelAdmin() {
  const usuario = useAuthStore((state) => state.usuario);
  const { mutate: cerrarSesion } = useCerrarSesion();
  const { data: resumen, isLoading, isFetching, refetch } = useAdminDashboard();

  return (
    <PantallaSegura>
      <FondoCuadricula />
      {/* Resplandor ambiental cian, en continuidad con el resto de la app. */}
      <LinearGradient
        colors={[colors.acento + '14', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.resplandorAmbiental}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.contenedor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.acento} />
        }
      >
        {/* Encabezado como tarjeta elevada, igual que el home ciudadano. */}
        <LinearGradient
          colors={[colors.superficie, colors.superficieAlterna]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.encabezado}
        >
          <View style={styles.avatar}>
            <Ionicons name="shield-half" size={24} color={colors.acento} />
          </View>

          <View style={styles.encabezadoTextos}>
            <Text style={styles.encabezadoEtiqueta}>BP SECURITY · ADMINISTRACIÓN</Text>
            <Text style={styles.titulo} numberOfLines={1}>
              Panel de control
            </Text>
            <View style={styles.encabezadoMeta}>
              <View style={styles.pastillaRol}>
                <Ionicons name="shield-checkmark" size={11} color={colors.acento} />
                <Text style={styles.pastillaRolTexto}>ADMIN</Text>
              </View>
              <Text style={styles.subtitulo} numberOfLines={1}>
                {usuario?.nombres} {usuario?.apellidos}
              </Text>
            </View>
          </View>

          {/* Cerrar sesión como ícono discreto: el rojo se reserva para las
              métricas y avisos que requieren atención. */}
          <Pressable
            style={styles.botonSalir}
            hitSlop={8}
            onPress={() =>
              cerrarSesion(undefined, { onSuccess: () => router.replace('/(auth)/login') })
            }
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textoSecundario} />
          </Pressable>
        </LinearGradient>

        {isLoading || !resumen ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color={colors.acento} />
            <Text style={styles.cargandoTexto}>Cargando métricas…</Text>
          </View>
        ) : (
          <>
            <View style={styles.seccion}>
              <TituloSeccion icono="people-outline" titulo="Usuarios" />
              <View style={styles.grid}>
                <Kpi icono="people" valor={resumen.usuarios.total} etiqueta="Total" />
                <Kpi
                  icono="ban"
                  valor={resumen.usuarios.suspendidos}
                  etiqueta="Suspendidos"
                  alerta={resumen.usuarios.suspendidos > 0}
                />
                <Kpi
                  icono="shield-checkmark"
                  valor={resumen.usuarios.administradores}
                  etiqueta="Admins"
                />
                <Kpi icono="star" valor={resumen.usuarios.lideres} etiqueta="Líderes" />
                <Kpi icono="person" valor={resumen.usuarios.ciudadanos} etiqueta="Ciudadanos" />
              </View>
            </View>

            <View style={styles.seccion}>
              <TituloSeccion icono="home-outline" titulo="Comunidades" />
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
            </View>

            <View style={styles.seccion}>
              <TituloSeccion icono="pulse-outline" titulo="Actividad" />
              <View style={styles.grid}>
                <Kpi
                  icono="alert-circle"
                  valor={resumen.actividad.alertas}
                  etiqueta="Alertas de pánico"
                />
                <Kpi
                  icono="person-circle"
                  valor={resumen.actividad.alertas_sin_comunidad_abiertas}
                  etiqueta="Sin comunidad (abiertas)"
                  alerta={resumen.actividad.alertas_sin_comunidad_abiertas > 0}
                />
                <Kpi icono="document-text" valor={resumen.actividad.reportes} etiqueta="Reportes" />
              </View>
            </View>

            <View style={styles.seccion}>
              <TituloSeccion icono="options-outline" titulo="Gestión" />
              <View style={styles.grid}>
                <AccionRapida
                  icono="people-circle-outline"
                  titulo="Gestión de usuarios"
                  onPress={() => router.push('/(app)/admin/users')}
                />
                <AccionRapida
                  icono="checkmark-done-outline"
                  titulo="Gestión de comunidades"
                  insignia={resumen.comunidades.pendientes}
                  onPress={() => router.push('/(app)/admin/communities-management')}
                />
                <AccionRapida
                  icono="alert-circle-outline"
                  titulo="Alertas sin comunidad"
                  insignia={resumen.actividad.alertas_sin_comunidad_abiertas}
                  onPress={() => router.push('/(app)/admin/alerts')}
                />
              </View>
            </View>

            <View style={styles.seccion}>
              <TituloSeccion icono="time-outline" titulo="Actividad reciente" />
              <LinearGradient
                colors={[colors.superficie, colors.superficieAlterna]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.feed}
              >
                {resumen.auditoria_reciente.length === 0 ? (
                  <View style={styles.vacio}>
                    <Ionicons name="checkmark-circle-outline" size={22} color={colors.textoTenue} />
                    <Text style={styles.vacioTexto}>Sin actividad registrada.</Text>
                  </View>
                ) : (
                  resumen.auditoria_reciente.map((entrada, indice) => (
                    <FilaAuditoria
                      key={entrada.id}
                      entrada={entrada}
                      esUltima={indice === resumen.auditoria_reciente.length - 1}
                    />
                  ))
                )}
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </PantallaSegura>
  );
}

/**
 * Tarjeta de métrica: el valor es el protagonista (grande, números tabulares) y
 * la etiqueta lo acompaña en segundo plano. El estado de alerta nunca es solo
 * color: cambia el badge, el valor y el borde, manteniendo ícono y etiqueta.
 */
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
    <LinearGradient
      colors={[colors.superficie, colors.superficieAlterna]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.kpi, alerta ? styles.kpiAlerta : null]}
    >
      <View style={[styles.kpiBadge, alerta ? styles.kpiBadgeAlerta : null]}>
        <Ionicons name={icono} size={15} color={alerta ? colors.peligro : colors.acento} />
      </View>
      <Text style={[styles.kpiValor, alerta ? styles.kpiValorAlerta : null]}>{valor}</Text>
      <Text style={styles.kpiEtiqueta} numberOfLines={2}>
        {etiqueta}
      </Text>
    </LinearGradient>
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

function FilaAuditoria({ entrada, esUltima }: { entrada: AuditoriaEntrada; esUltima: boolean }) {
  const { texto, icono } = describirAccion(entrada.accion);
  const quien = entrada.usuario
    ? `${entrada.usuario.nombres} ${entrada.usuario.apellidos}`
    : 'Sistema';

  return (
    <View style={[styles.filaAuditoria, esUltima ? styles.filaAuditoriaUltima : null]}>
      <View style={styles.auditoriaBadge}>
        <Ionicons name={icono} size={14} color={colors.textoSecundario} />
      </View>
      <View style={styles.auditoriaTextos}>
        <Text style={styles.auditoriaTexto}>{texto}</Text>
        <Text style={styles.auditoriaMeta} numberOfLines={1}>
          {quien}
        </Text>
      </View>
      <Text style={styles.auditoriaHora}>{tiempoRelativo(entrada.creado_en)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resplandorAmbiental: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  contenedor: {
    padding: 24,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 14,
    // Sombra suave tintada al fondo para dar elevación (no gris puro).
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 2,
    borderColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encabezadoTextos: {
    flex: 1,
  },
  encabezadoEtiqueta: {
    fontSize: 10,
    color: colors.acento,
    fontWeight: '700',
    letterSpacing: 1,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.texto,
    marginTop: 1,
  },
  encabezadoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  pastillaRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.acento + '1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastillaRolTexto: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.acento,
  },
  subtitulo: {
    flex: 1,
    fontSize: 11,
    color: colors.textoSecundario,
  },
  botonSalir: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  cargando: {
    alignItems: 'center',
    gap: 12,
    marginTop: 48,
  },
  cargandoTexto: {
    color: colors.textoSecundario,
    fontSize: 13,
  },
  seccion: {
    marginTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpi: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 16,
    padding: 14,
  },
  kpiAlerta: {
    borderColor: colors.peligro + '55',
  },
  kpiBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.acento + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgeAlerta: {
    backgroundColor: colors.peligro + '1F',
  },
  kpiValor: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.texto,
    // Números tabulares: los dígitos ocupan el mismo ancho y las métricas
    // quedan alineadas entre tarjetas.
    fontVariant: ['tabular-nums'],
  },
  kpiValorAlerta: {
    color: colors.peligro,
  },
  kpiEtiqueta: {
    fontSize: 11,
    color: colors.textoSecundario,
  },
  feed: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingHorizontal: 14,
  },
  filaAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  filaAuditoriaUltima: {
    borderBottomWidth: 0,
  },
  auditoriaBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.superficieAlterna,
    borderWidth: 1,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditoriaTextos: {
    flex: 1,
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
  auditoriaHora: {
    fontSize: 10,
    color: colors.textoTenue,
    fontVariant: ['tabular-nums'],
  },
  vacio: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  vacioTexto: {
    color: colors.textoSecundario,
    fontSize: 13,
  },
});
