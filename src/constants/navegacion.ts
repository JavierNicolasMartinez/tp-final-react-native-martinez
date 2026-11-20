import { colores } from './tema';

export const opcionesEncabezado = {
  headerStyle: { backgroundColor: colores.primario },
  headerTintColor: colores.textoSobrePrimario,
  contentStyle: { backgroundColor: colores.fondo },
} as const;

export const opcionesTabs = {
  tabBarActiveTintColor: colores.primario,
  tabBarInactiveTintColor: colores.textoSecundario,
  headerStyle: { backgroundColor: colores.primario },
  headerTintColor: colores.textoSobrePrimario,
  sceneStyle: { backgroundColor: colores.fondo },
} as const;
