import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';

// Calibración de la detección. El reposo mide ~1 g por la gravedad, así que el
// umbral debe estar cómodamente por encima para no confundir un movimiento
// normal con una sacudida. Exigir varias sacudidas dentro de una ventana corta
// filtra golpes sueltos y el vaivén al caminar; el cooldown evita reenvíos.
const UMBRAL_G = 1.8;
const SACUDIDAS_REQUERIDAS = 3;
const VENTANA_MS = 1200;
const COOLDOWN_MS = 3000;
// En Android 12+ el sistema limita el muestreo a 200 ms mínimo sin permisos de
// alta frecuencia; pedimos 100 ms y el SO lo ajusta si hace falta.
const INTERVALO_MUESTREO_MS = 100;

interface OpcionesDeteccionSacudida {
  /** Cuando es `false` el sensor se apaga (ahorra batería y evita disparos). */
  habilitado: boolean;
  /** Se invoca al confirmar una sacudida (varias sacudidas fuertes seguidas). */
  onSacudida: () => void;
}

/**
 * Detecta cuando el usuario sacude el teléfono con fuerza y llama a `onSacudida`.
 * Pensado como segunda vía para activar el pánico sin mirar la pantalla: exige
 * SACUDIDAS_REQUERIDAS golpes por encima de UMBRAL_G dentro de VENTANA_MS y
 * respeta un COOLDOWN_MS para no reenviar. No se suscribe si `habilitado` es
 * `false`, por lo que apagar el sensor durante una alerta en curso es inmediato.
 */
export function useDeteccionSacudida({ habilitado, onSacudida }: OpcionesDeteccionSacudida): void {
  // Guardamos el callback en una ref para no re-suscribir el sensor cada render.
  const onSacudidaRef = useRef(onSacudida);
  onSacudidaRef.current = onSacudida;

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    // Marcas de tiempo de las sacudidas recientes dentro de la ventana activa.
    let sacudidasRecientes: number[] = [];
    let ultimoDisparo = 0;

    Accelerometer.setUpdateInterval(INTERVALO_MUESTREO_MS);

    const suscripcion = Accelerometer.addListener(({ x, y, z }) => {
      const magnitud = Math.sqrt(x * x + y * y + z * z);

      if (magnitud < UMBRAL_G) {
        return;
      }

      const ahora = Date.now();

      if (ahora - ultimoDisparo < COOLDOWN_MS) {
        return;
      }

      // Conservamos solo las sacudidas que siguen dentro de la ventana.
      sacudidasRecientes = sacudidasRecientes.filter((marca) => ahora - marca < VENTANA_MS);
      sacudidasRecientes.push(ahora);

      if (sacudidasRecientes.length >= SACUDIDAS_REQUERIDAS) {
        ultimoDisparo = ahora;
        sacudidasRecientes = [];
        onSacudidaRef.current();
      }
    });

    return () => {
      suscripcion.remove();
    };
  }, [habilitado]);
}
