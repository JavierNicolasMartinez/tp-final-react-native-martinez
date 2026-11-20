import * as SplashScreen from 'expo-splash-screen';

import { NavegacionRaiz } from '../components/NavegacionRaiz';
import { BibliotecaProvider } from '../context/BibliotecaContext';
import { configurarNotificaciones } from '../lib/notificaciones';

configurarNotificaciones();

// La pantalla de inicio queda visible hasta que se termine de leer lo guardado.
SplashScreen.preventAutoHideAsync();

// Si se entra por un deep link (por ejemplo a /buscar), las tabs quedan debajo en la pila.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function LayoutRaiz() {
  return (
    <BibliotecaProvider>
      <NavegacionRaiz />
    </BibliotecaProvider>
  );
}
