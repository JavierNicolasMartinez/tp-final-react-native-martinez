import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Libro } from '../types';
import type { Prestamo } from '../types/biblioteca';

const CLAVE = 'biblioteca-ipf/estado';

export type EstadoGuardado = {
  prestamos: Prestamo[];
  recientes: Libro[];
  esperas: Record<string, string[]>;
};

export async function cargarEstado(): Promise<EstadoGuardado | null> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE);
    if (!texto) return null;
    const datos = JSON.parse(texto) as EstadoGuardado;
    if (!Array.isArray(datos.prestamos) || !Array.isArray(datos.recientes)) return null;
    return datos;
  } catch {
    // Si lo guardado está roto o no se puede leer, la app arranca de cero.
    return null;
  }
}

export async function guardarEstado(estado: EstadoGuardado): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Si no se puede guardar, la app sigue funcionando con lo que tiene en memoria.
  }
}
