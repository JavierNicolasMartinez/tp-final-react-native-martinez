import { useContext } from 'react';

import { BibliotecaContext, type BibliotecaValor } from '../context/BibliotecaContext';

export function useBiblioteca(): BibliotecaValor {
  const valor = useContext(BibliotecaContext);
  if (!valor) {
    throw new Error('useBiblioteca tiene que usarse dentro de BibliotecaProvider');
  }
  return valor;
}
