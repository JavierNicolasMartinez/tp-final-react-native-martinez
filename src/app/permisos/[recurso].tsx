import { Stack, useLocalSearchParams } from 'expo-router';

import { NoEncontrado } from '../../components/NoEncontrado';
import { PantallaPermiso } from '../../components/PantallaPermiso';
import { textosPermiso } from '../../constants/permisos';
import { esRecurso } from '../../lib/permisos';
import { leerParametro } from '../../lib/rutas';

export default function PermisoPrevio() {
  const params = useLocalSearchParams<{ recurso: string; isbn?: string }>();
  const recurso = leerParametro(params.recurso);
  const isbn = leerParametro(params.isbn);

  if (!esRecurso(recurso)) {
    return (
      <NoEncontrado
        titulo="Permiso desconocido"
        mensaje="La app solo usa la cámara y las notificaciones."
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: textosPermiso[recurso].titulo }} />
      <PantallaPermiso recurso={recurso} isbn={isbn || undefined} />
    </>
  );
}
