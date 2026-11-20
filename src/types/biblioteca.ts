// "estante": el ejemplar salió del estante al reservar.
// "espera": el personal se lo entregó desde la lista de espera.
export type OrigenPrestamo = 'estante' | 'espera';

export type Prestamo = {
  isbn: string;
  vence: number;
  origen: OrigenPrestamo;
  notificacionId: string | null;
};

export type Aviso = {
  id: string;
  texto: string;
};

export type ResultadoReserva =
  | { tipo: 'prestamo'; vence: number }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'repetida' };
