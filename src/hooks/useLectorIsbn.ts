import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { buscarLibroPorIsbn, esIsbnValido } from '../lib/catalogo';

export function useLectorIsbn() {
  // Un ref cambia al instante; un estado recién se ve en el próximo render,
  // y la cámara puede llamar varias veces antes de que ese render ocurra.
  const yaNavego = useRef(false);
  const ultimoDesconocido = useRef<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const abrir = useCallback((codigo: string, desdeCamara: boolean) => {
    if (yaNavego.current) return;
    const isbn = codigo.trim();

    if (!esIsbnValido(isbn)) {
      if (!desdeCamara) {
        setAviso('El ISBN tiene 13 números, sin guiones ni espacios. Revisalo y probá de nuevo.');
      }
      return;
    }

    if (!buscarLibroPorIsbn(isbn)) {
      // El mismo código sigue frente a la cámara: ya avisamos, no repetimos el aviso.
      if (desdeCamara && ultimoDesconocido.current === isbn) return;
      ultimoDesconocido.current = isbn;
      setAviso(`El libro con ISBN ${isbn} no está en el catálogo. Podés probar con otro.`);
      return;
    }

    yaNavego.current = true;
    // replace: el escáner no queda en el historial, atrás vuelve a donde estabas antes.
    router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
  }, []);

  const leerCodigo = useCallback((codigo: string) => abrir(codigo, true), [abrir]);
  const escribirCodigo = useCallback((codigo: string) => abrir(codigo, false), [abrir]);

  return { aviso, leerCodigo, escribirCodigo };
}
