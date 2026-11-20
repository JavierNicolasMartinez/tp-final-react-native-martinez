import { ScrollView, StyleSheet, Text } from 'react-native';

import { IngresoIsbn } from '../components/IngresoIsbn';
import { ZonaCamara } from '../components/ZonaCamara';
import { colores, espaciado, tamanios } from '../constants/tema';
import { useLectorIsbn } from '../hooks/useLectorIsbn';
import { usePermiso } from '../hooks/usePermiso';

export default function Escanear() {
  const { estado } = usePermiso('camara');
  const { aviso, leerCodigo, escribirCodigo } = useLectorIsbn();

  return (
    <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <ZonaCamara estado={estado} onCodigo={leerCodigo} />
      {aviso && (
        <Text style={estilos.aviso} accessibilityRole="alert">
          {aviso}
        </Text>
      )}
      <IngresoIsbn onAbrir={escribirCodigo} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: espaciado.lg,
    padding: espaciado.md,
  },
  aviso: {
    fontSize: tamanios.texto,
    color: colores.aviso,
    backgroundColor: colores.avisoFondo,
    padding: espaciado.md,
    borderRadius: tamanios.radio,
  },
});
