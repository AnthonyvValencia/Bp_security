import * as Location from 'expo-location';

export interface Ubicacion {
  latitud: number | null;
  longitud: number | null;
}

export async function obtenerUbicacionActual(): Promise<Ubicacion> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();

    if (permiso.status !== 'granted') {
      return { latitud: null, longitud: null };
    }

    const posicion = await Location.getCurrentPositionAsync({});

    return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude };
  } catch {
    return { latitud: null, longitud: null };
  }
}
