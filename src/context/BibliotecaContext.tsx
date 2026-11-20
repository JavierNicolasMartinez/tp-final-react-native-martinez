import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ALUMNO } from '../constants/biblioteca';
import { ESPERA_INICIAL } from '../data/esperaInicial';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import { cargarEstado, guardarEstado } from '../lib/almacenamiento';
import { calcularVencimiento } from '../lib/fechas';
import { idsProgramados } from '../lib/notificaciones';
import type { Libro } from '../types';
import type { Aviso, Prestamo, ResultadoReserva } from '../types/biblioteca';

type Esperas = Record<string, Cola<string>>;

export type BibliotecaValor = {
  prestamos: Prestamo[];
  esperas: Esperas;
  recientes: Pila<Libro>;
  sesion: boolean;
  avisos: Aviso[];
  disponibles: (libro: Libro) => number;
  posicionEnEspera: (isbn: string) => number;
  tienePrestamo: (isbn: string) => boolean;
  verLibro: (libro: Libro) => void;
  reservar: (libro: Libro) => ResultadoReserva;
  devolver: (isbn: string) => void;
  guardarRecordatorio: (isbn: string, notificacionId: string | null) => void;
  entregarAlSiguiente: (isbn: string) => string | undefined;
  iniciarSesion: () => void;
  cerrarSesion: () => void;
  agregarAviso: (texto: string) => void;
  descartarAviso: (id: string) => void;
};

export const BibliotecaContext = createContext<BibliotecaValor | null>(null);

function crearEsperas(listas: Record<string, string[]>): Esperas {
  const esperas: Esperas = {};
  for (const [isbn, personas] of Object.entries(listas)) {
    esperas[isbn] = new Cola(personas);
  }
  return esperas;
}

function esperasAListas(esperas: Esperas): Record<string, string[]> {
  const listas: Record<string, string[]> = {};
  for (const [isbn, cola] of Object.entries(esperas)) {
    listas[isbn] = cola.aArray();
  }
  return listas;
}

type Props = {
  children: ReactNode;
};

export function BibliotecaProvider({ children }: Props) {
  const [cargado, setCargado] = useState(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [esperas, setEsperas] = useState<Esperas>(() => crearEsperas(ESPERA_INICIAL));
  const [recientes, setRecientes] = useState(() => new Pila<Libro>());
  const [sesion, setSesion] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  // Al iniciar, recupera lo guardado. Si una notificación ya llegó (o se borró)
  // mientras la app estaba cerrada, su identificador guardado ya no sirve y se limpia.
  useEffect(() => {
    let vigente = true;
    Promise.all([cargarEstado(), idsProgramados()]).then(([guardado, programados]) => {
      if (!vigente) return;
      if (guardado) {
        setPrestamos(
          guardado.prestamos.map((p) =>
            p.notificacionId && programados && !programados.has(p.notificacionId)
              ? { ...p, notificacionId: null }
              : p,
          ),
        );
        setRecientes(new Pila(guardado.recientes));
        setEsperas(crearEsperas(guardado.esperas));
      }
      setCargado(true);
    });
    return () => {
      vigente = false;
    };
  }, []);

  // Cada cambio se guarda. Recién después de cargar, para no pisar lo guardado con el estado inicial.
  useEffect(() => {
    if (!cargado) return;
    guardarEstado({ prestamos, recientes: recientes.aArray(), esperas: esperasAListas(esperas) });
  }, [cargado, prestamos, recientes, esperas]);

  const tienePrestamo = useCallback(
    (isbn: string) => prestamos.some((p) => p.isbn === isbn),
    [prestamos],
  );

  const posicionEnEspera = useCallback(
    (isbn: string) => (esperas[isbn]?.aArray().indexOf(ALUMNO) ?? -1) + 1,
    [esperas],
  );

  // Se calcula: los ejemplares iniciales menos los que salieron del estante en mis préstamos.
  const disponibles = useCallback(
    (libro: Libro) => {
      const prestadosDelEstante = prestamos.filter(
        (p) => p.isbn === libro.isbn && p.origen === 'estante',
      ).length;
      return Math.max(0, libro.ejemplares - prestadosDelEstante);
    },
    [prestamos],
  );

  // La Pila nunca se muta: si hay que apilar, se arma una nueva a partir de la anterior.
  const verLibro = useCallback((libro: Libro) => {
    setRecientes((anterior) => {
      if (anterior.tope()?.isbn === libro.isbn) return anterior;
      const nueva = new Pila(anterior.aArray());
      nueva.push(libro);
      return nueva;
    });
  }, []);

  const reservar = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (tienePrestamo(libro.isbn) || posicionEnEspera(libro.isbn) > 0) {
        return { tipo: 'repetida' };
      }
      const cola = esperas[libro.isbn];
      const nadieEspera = !cola || cola.vacia;
      if (disponibles(libro) > 0 && nadieEspera) {
        const vence = calcularVencimiento(Date.now());
        setPrestamos([
          ...prestamos,
          { isbn: libro.isbn, vence, origen: 'estante', notificacionId: null },
        ]);
        return { tipo: 'prestamo', vence };
      }
      const nueva = new Cola(cola?.aArray() ?? []);
      nueva.encolar(ALUMNO);
      setEsperas({ ...esperas, [libro.isbn]: nueva });
      return { tipo: 'espera', posicion: nueva.tamanio };
    },
    [disponibles, esperas, posicionEnEspera, prestamos, tienePrestamo],
  );

  // Estas dos se llaman después de un await (programar o cancelar la notificación),
  // por eso parten del valor anterior y no de una copia que puede estar vieja.
  const devolver = useCallback((isbn: string) => {
    setPrestamos((anteriores) => anteriores.filter((p) => p.isbn !== isbn));
  }, []);

  const guardarRecordatorio = useCallback((isbn: string, notificacionId: string | null) => {
    setPrestamos((anteriores) =>
      anteriores.map((p) => (p.isbn === isbn ? { ...p, notificacionId } : p)),
    );
  }, []);

  const entregarAlSiguiente = useCallback(
    (isbn: string) => {
      const cola = esperas[isbn];
      if (!cola || cola.vacia) return undefined;
      const nueva = new Cola(cola.aArray());
      const persona = nueva.desencolar();
      setEsperas({ ...esperas, [isbn]: nueva });
      if (persona === ALUMNO) {
        setPrestamos([
          ...prestamos,
          {
            isbn,
            vence: calcularVencimiento(Date.now()),
            origen: 'espera',
            notificacionId: null,
          },
        ]);
      }
      return persona;
    },
    [esperas, prestamos],
  );

  const iniciarSesion = useCallback(() => setSesion(true), []);
  const cerrarSesion = useCallback(() => setSesion(false), []);

  const agregarAviso = useCallback((texto: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setAvisos((anteriores) => [...anteriores, { id, texto }]);
  }, []);

  const descartarAviso = useCallback((id: string) => {
    setAvisos((anteriores) => anteriores.filter((a) => a.id !== id));
  }, []);

  const valor = useMemo<BibliotecaValor>(
    () => ({
      prestamos,
      esperas,
      recientes,
      sesion,
      avisos,
      disponibles,
      posicionEnEspera,
      tienePrestamo,
      verLibro,
      reservar,
      devolver,
      guardarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      agregarAviso,
      descartarAviso,
    }),
    [
      prestamos,
      esperas,
      recientes,
      sesion,
      avisos,
      disponibles,
      posicionEnEspera,
      tienePrestamo,
      verLibro,
      reservar,
      devolver,
      guardarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      agregarAviso,
      descartarAviso,
    ],
  );

  // Mientras se lee lo guardado no se muestra nada: sigue la pantalla de inicio (splash),
  // así la app no aparece "vacía" un instante y después se llena.
  if (!cargado) return null;

  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}
