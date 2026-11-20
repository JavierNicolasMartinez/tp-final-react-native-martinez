import type { PermissionResponse } from 'expo';

import type { EstadoPermiso, Recurso } from '../types/permisos';

export function esRecurso(texto: string): texto is Recurso {
  return texto === 'camara' || texto === 'notificaciones';
}

// No alcanza con mirar status: "denied" puede ser preguntable o bloqueado.
// Lo que decide si se puede volver a mostrar el diálogo es canAskAgain.
export function calcularEstado(respuesta: PermissionResponse | null): EstadoPermiso {
  if (respuesta === null) return 'cargando';
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}
