import { Stack } from 'expo-router';

import { BotonPersonal } from '../../../components/BotonPersonal';
import { opcionesEncabezado } from '../../../constants/navegacion';

// Si se entra por un deep link a /libro/[isbn], el Catálogo queda debajo.
export const unstable_settings = {
  anchor: 'index',
};

export default function LayoutCatalogo() {
  return (
    <Stack screenOptions={opcionesEncabezado}>
      <Stack.Screen
        name="index"
        options={{ title: 'Catálogo', headerRight: () => <BotonPersonal /> }}
      />
      <Stack.Screen name="libro/[isbn]" options={{ title: 'Libro' }} />
    </Stack>
  );
}
