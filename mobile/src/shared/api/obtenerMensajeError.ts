import { isAxiosError } from 'axios';

export function obtenerMensajeError(error: unknown, mensajePorDefecto: string): string {
  if (isAxiosError(error)) {
    const errores = error.response?.data?.errors;

    if (errores && typeof errores === 'object') {
      const primerCampo = Object.values(errores)[0];

      if (Array.isArray(primerCampo) && typeof primerCampo[0] === 'string') {
        return primerCampo[0];
      }
    }

    const mensaje = error.response?.data?.message;

    if (typeof mensaje === 'string') {
      return mensaje;
    }
  }

  return mensajePorDefecto;
}
