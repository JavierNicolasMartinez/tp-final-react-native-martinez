import { router } from 'expo-router';
import { useCallback } from 'react';

import { buscarLibroPorIsbn } from '../lib/catalogo';
import {
  cancelarRecordatorio,
  consultarPermisoNotificaciones,
  programarRecordatorio,
} from '../lib/notificaciones';
import { useBiblioteca } from './useBiblioteca';

export function useRecordatorio() {
  const { prestamos, guardarRecordatorio, agregarAviso } = useBiblioteca();

  const programar = useCallback(
    async (isbn: string) => {
      const titulo = buscarLibroPorIsbn(isbn)?.titulo ?? 'tu libro';
      try {
        const id = await programarRecordatorio(titulo);
        guardarRecordatorio(isbn, id);
      } catch {
        agregarAviso(
          'No pudimos programar el recordatorio en este teléfono. Fijate la fecha de devolución en esta pantalla.',
        );
      }
    },
    [guardarRecordatorio, agregarAviso],
  );

  // El permiso de notificaciones se pide recién acá: cuando la persona activa "Recordarme".
  const activar = useCallback(
    async (isbn: string) => {
      const permiso = await consultarPermisoNotificaciones();
      if (permiso.granted) {
        await programar(isbn);
        return;
      }
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones', isbn },
      });
    },
    [programar],
  );

  const desactivar = useCallback(
    async (isbn: string) => {
      const id = prestamos.find((p) => p.isbn === isbn)?.notificacionId;
      guardarRecordatorio(isbn, null);
      if (id) await cancelarRecordatorio(id);
    },
    [prestamos, guardarRecordatorio],
  );

  return { activar, desactivar, programar };
}
