import { useCallback, useEffect, useState } from 'react';

import { mensajes } from '../constants/mensajes';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

type Resultado = {
  clave: string;
  libros: Libro[];
  error: string | null;
};

export function useBusqueda(q: string) {
  const texto = q.trim();
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const clave = `${intento}|${texto}`;

  useEffect(() => {
    if (texto === '') return;
    let vigente = true;
    const claveDelPedido = `${intento}|${texto}`;
    buscarLibros(texto)
      .then((libros) => {
        if (vigente) setResultado({ clave: claveDelPedido, libros, error: null });
      })
      .catch(() => {
        if (vigente) {
          setResultado({ clave: claveDelPedido, libros: [], error: mensajes.errorBusqueda });
        }
      });
    // Si cambia el texto antes de que llegue la respuesta, este pedido queda vencido
    // y su respuesta se descarta aunque llegue después que la del pedido nuevo.
    return () => {
      vigente = false;
    };
  }, [texto, intento]);

  const reintentar = useCallback(() => {
    setIntento((anterior) => anterior + 1);
  }, []);

  const actual = resultado?.clave === clave ? resultado : null;

  return {
    resultados: actual?.libros ?? [],
    cargando: texto !== '' && actual === null,
    error: actual?.error ?? null,
    reintentar,
  };
}
