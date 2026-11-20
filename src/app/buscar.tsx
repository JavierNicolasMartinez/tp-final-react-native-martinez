import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CampoBusqueda } from '../components/CampoBusqueda';
import { ResultadosBusqueda } from '../components/ResultadosBusqueda';
import { colores } from '../constants/tema';
import { useBusqueda } from '../hooks/useBusqueda';
import { leerParametro } from '../lib/rutas';

export default function Buscar() {
  // La búsqueda vive en la URL: /buscar?q=borges
  const q = leerParametro(useLocalSearchParams<{ q?: string }>().q);
  const { resultados, cargando, error, reintentar } = useBusqueda(q);

  return (
    <View style={estilos.pantalla}>
      <CampoBusqueda valor={q} onCambiar={(texto) => router.setParams({ q: texto })} />
      <ResultadosBusqueda
        texto={q}
        resultados={resultados}
        cargando={cargando}
        error={error}
        onReintentar={reintentar}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
});
