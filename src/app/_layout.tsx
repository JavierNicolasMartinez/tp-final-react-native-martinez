import { NavegacionRaiz } from '../components/NavegacionRaiz';
import { BibliotecaProvider } from '../context/BibliotecaContext';

export default function LayoutRaiz() {
  return (
    <BibliotecaProvider>
      <NavegacionRaiz />
    </BibliotecaProvider>
  );
}
