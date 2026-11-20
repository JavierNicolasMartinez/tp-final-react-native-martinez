import { NavegacionRaiz } from '../components/NavegacionRaiz';
import { BibliotecaProvider } from '../context/BibliotecaContext';
import { configurarNotificaciones } from '../lib/notificaciones';

configurarNotificaciones();

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
