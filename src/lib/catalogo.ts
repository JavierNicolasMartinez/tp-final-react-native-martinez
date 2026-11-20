import { LIBROS } from '../data/libros';
import type { Libro } from '../types';

export function esIsbnValido(texto: string): boolean {
  return /^\d{13}$/.test(texto);
}

export function buscarLibroPorIsbn(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}
