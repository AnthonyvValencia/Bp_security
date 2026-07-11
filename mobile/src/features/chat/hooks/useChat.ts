import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { chatApi } from '@/src/features/chat/api/chatApi';
import type { MensajeChat } from '@/src/features/chat/types';
import { obtenerEcho } from '@/src/shared/services/realtime';

function claveChat(comunidadId: number) {
  return ['chat', comunidadId] as const;
}

/**
 * Inserta un mensaje en la lista cacheada de forma idempotente por id: el
 * mismo mensaje llega por dos vías (la respuesta del POST y el evento de
 * Reverb, que también recibe el propio remitente) y no debe duplicarse.
 */
function upsertMensaje(actuales: MensajeChat[] | undefined, mensaje: MensajeChat): MensajeChat[] {
  if (!actuales) {
    return [mensaje];
  }

  return actuales.some((item) => item.id === mensaje.id)
    ? actuales.map((item) => (item.id === mensaje.id ? mensaje : item))
    : [...actuales, mensaje];
}

export function useMensajesChat(comunidadId: number) {
  const queryClient = useQueryClient();
  const clave = claveChat(comunidadId);
  const esValido = Number.isFinite(comunidadId) && comunidadId > 0;

  useEffect(() => {
    if (!esValido) {
      return;
    }

    const nombreCanal = `comunidad.${comunidadId}.chat`;
    const canal = obtenerEcho().private(nombreCanal);

    const manejador = (evento: { mensaje: MensajeChat }) => {
      queryClient.setQueryData<MensajeChat[]>(clave, (actuales) =>
        upsertMensaje(actuales, evento.mensaje),
      );
    };

    canal.listen('.mensaje.enviado', manejador);

    return () => {
      canal.stopListening('.mensaje.enviado', manejador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clave se deriva de comunidadId
  }, [comunidadId, esValido, queryClient]);

  return useQuery({
    queryKey: clave,
    queryFn: () => chatApi.listar(comunidadId),
    enabled: esValido,
    staleTime: 0,
    // Respaldo por si el WebSocket se desconecta; la entrega principal de
    // mensajes nuevos es en tiempo real (ver arriba).
    refetchInterval: 30000,
  });
}

export function useEnviarMensaje(comunidadId: number) {
  const queryClient = useQueryClient();
  const clave = claveChat(comunidadId);

  return useMutation({
    mutationFn: (contenido: string) => chatApi.enviar(comunidadId, contenido),
    onSuccess: (mensaje) => {
      queryClient.setQueryData<MensajeChat[]>(clave, (actuales) =>
        upsertMensaje(actuales, mensaje),
      );
    },
  });
}

export function useEliminarMensaje(comunidadId: number) {
  const queryClient = useQueryClient();
  const clave = claveChat(comunidadId);

  return useMutation({
    mutationFn: (mensajeId: number) => chatApi.eliminar(mensajeId),
    // Optimista: el mensaje desaparece al instante; si el servidor falla, se
    // restaura la lista previa.
    onMutate: async (mensajeId) => {
      await queryClient.cancelQueries({ queryKey: clave });

      const mensajesPrevios = queryClient.getQueryData<MensajeChat[]>(clave);

      queryClient.setQueryData<MensajeChat[]>(clave, (actuales) =>
        actuales?.filter((mensaje) => mensaje.id !== mensajeId),
      );

      return { mensajesPrevios };
    },
    onError: (_error, _mensajeId, contexto) => {
      if (contexto?.mensajesPrevios) {
        queryClient.setQueryData(clave, contexto.mensajesPrevios);
      }
    },
  });
}
