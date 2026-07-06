import * as Location from 'expo-location';
import { useState } from 'react';

interface Coordenadas {
  latitud: number;
  longitud: number;
}

interface EstadoUbicacion {
  coordenadas: Coordenadas | null;
  cargando: boolean;
  error: string | null;
}

export function useUbicacionActual() {
  const [estado, setEstado] = useState<EstadoUbicacion>({
    coordenadas: null,
    cargando: false,
    error: null,
  });

  const capturarUbicacion = async (): Promise<Coordenadas | null> => {
    setEstado({ coordenadas: null, cargando: true, error: null });

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setEstado({
        coordenadas: null,
        cargando: false,
        error: 'Permiso de ubicación denegado. Puedes omitir este paso y completarlo después.',
      });

      return null;
    }

    try {
      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordenadas: Coordenadas = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      };

      setEstado({ coordenadas, cargando: false, error: null });

      return coordenadas;
    } catch {
      setEstado({
        coordenadas: null,
        cargando: false,
        error: 'No se pudo obtener tu ubicación. Intenta de nuevo.',
      });

      return null;
    }
  };

  return { ...estado, capturarUbicacion };
}
