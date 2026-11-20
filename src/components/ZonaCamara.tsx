import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { textosPermiso } from '../constants/permisos';
import { colores, espaciado, tamanios } from '../constants/tema';
import type { EstadoPermiso } from '../types/permisos';
import { Boton } from './Boton';

type Props = {
  estado: EstadoPermiso;
  onCodigo: (codigo: string) => void;
};

function irAPermiso() {
  router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } });
}

export function ZonaCamara({ estado, onCodigo }: Props) {
  if (estado === 'cargando') {
    return (
      <View style={estilos.caja} accessibilityLabel="Revisando el permiso de la cámara">
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={estilos.texto}>Revisando el permiso de la cámara…</Text>
      </View>
    );
  }

  if (estado === 'concedido') {
    return (
      <View style={estilos.marco}>
        <CameraView
          style={estilos.camara}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={({ data }) => onCodigo(data)}
          accessibilityLabel="Cámara: apuntá al código de barras de la contratapa"
        />
        <Text style={estilos.ayuda}>Apuntá al código de barras de la contratapa.</Text>
      </View>
    );
  }

  if (estado === 'preguntable') {
    return (
      <View style={estilos.caja}>
        <Text style={estilos.texto}>{textosPermiso.camara.beneficio}</Text>
        <Boton texto="Usar la cámara" icono="camera-outline" onPress={irAPermiso} />
      </View>
    );
  }

  return (
    <View style={estilos.caja}>
      <Text style={estilos.texto}>{textosPermiso.camara.bloqueado}</Text>
      <Boton texto="Habilitar la cámara" icono="settings-outline" onPress={irAPermiso} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    minHeight: tamanios.alturaCamara,
    padding: espaciado.lg,
    backgroundColor: colores.superficie,
    borderRadius: tamanios.radio,
    borderWidth: tamanios.borde,
    borderColor: colores.borde,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
  marco: {
    gap: espaciado.sm,
  },
  camara: {
    height: tamanios.alturaCamara,
    borderRadius: tamanios.radio,
    overflow: 'hidden',
  },
  ayuda: {
    fontSize: tamanios.textoChico,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
