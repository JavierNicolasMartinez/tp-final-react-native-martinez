import { DIAS_PRESTAMO, MS_POR_DIA } from '../constants/biblioteca';

export function calcularVencimiento(desde: number): number {
  return desde + DIAS_PRESTAMO * MS_POR_DIA;
}

export function formatearFecha(ms: number): string {
  return new Date(ms).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
