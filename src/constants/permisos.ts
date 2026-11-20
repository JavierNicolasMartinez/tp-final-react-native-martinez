import type { Recurso } from '../types/permisos';

type TextosPermiso = {
  titulo: string;
  beneficio: string;
  bloqueado: string;
};

export const textosPermiso: Record<Recurso, TextosPermiso> = {
  camara: {
    titulo: 'Cámara',
    beneficio: 'Usamos tu cámara para leer el código de barras del libro y abrirlo al instante.',
    bloqueado:
      'La cámara está bloqueada para esta app. Podés habilitarla en Ajustes o escribir el ISBN a mano.',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio: 'Usamos las notificaciones para recordarte la devolución antes de que se venza.',
    bloqueado:
      'Las notificaciones están bloqueadas. Podés habilitarlas en Ajustes; mientras tanto, te avisamos dentro de la app.',
  },
};
