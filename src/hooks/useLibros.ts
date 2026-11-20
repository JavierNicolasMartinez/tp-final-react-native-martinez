import { useCallback, useEffect, useState } from 'react';

import { mensajes } from '../constants/mensajes';
import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

type Resultado = {
  intento: number;
  libros: Libro[];
  error: string | null;
};

export function useLibros() {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerLibros()
      .then((libros) => {
        if (vigente) setResultado({ intento, libros, error: null });
      })
      .catch(() => {
        if (vigente) setResultado({ intento, libros: [], error: mensajes.errorCatalogo });
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setIntento((anterior) => anterior + 1);
  }, []);

  // Está cargando mientras no llegó la respuesta del intento actual.
  const actual = resultado !== null && resultado.intento === intento ? resultado : null;

  return {
    libros: actual?.libros ?? [],
    cargando: actual === null,
    error: actual?.error ?? null,
    reintentar,
  };
}
