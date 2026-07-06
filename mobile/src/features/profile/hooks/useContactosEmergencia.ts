import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  contactosEmergenciaApi,
  type ContactoEmergenciaPayload,
} from '@/src/features/profile/api/contactosEmergenciaApi';

const CLAVE_CONTACTOS = ['contactos-emergencia'] as const;

export function useContactosEmergencia() {
  return useQuery({
    queryKey: CLAVE_CONTACTOS,
    queryFn: contactosEmergenciaApi.listar,
  });
}

export function useCrearContactoEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContactoEmergenciaPayload) => contactosEmergenciaApi.crear(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_CONTACTOS }),
  });
}

export function useEliminarContactoEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contactosEmergenciaApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_CONTACTOS }),
  });
}
