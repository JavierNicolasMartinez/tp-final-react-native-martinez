import { Stack } from 'expo-router';

import { opcionesEncabezado } from '../constants/navegacion';
import { useBiblioteca } from '../hooks/useBiblioteca';

export function NavegacionRaiz() {
  const { sesion } = useBiblioteca();

  return (
    <Stack screenOptions={opcionesEncabezado}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
      <Stack.Screen
        name="reservar/[isbn]"
        options={{ presentation: 'modal', title: 'Reservar' }}
      />
      <Stack.Screen
        name="permisos/[recurso]"
        options={{ presentation: 'modal', title: 'Permiso' }}
      />
      <Stack.Protected guard={!sesion}>
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', title: 'Ingreso del personal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={sesion}>
        <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
      </Stack.Protected>
    </Stack>
  );
}
