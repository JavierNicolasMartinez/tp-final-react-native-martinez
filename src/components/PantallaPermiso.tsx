import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { textosPermiso } from '../constants/permisos';
import { colores, espaciado, tamanios } from '../constants/tema';
import { usePermiso } from '../hooks/usePermiso';
import type { Recurso } from '../types/permisos';
import { Boton } from './Boton';
import { EstadoCargando } from './EstadoCargando';

type Props = {
  recurso: Recurso;
};

function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function PantallaPermiso({ recurso }: Props) {
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const textos = textosPermiso[recurso];

  // El diálogo del sistema aparece recién acá, cuando la persona ya leyó para qué sirve.
  async function continuar() {
    await pedir();
    volver();
  }

  if (estado === 'cargando') return <EstadoCargando mensaje="Revisando el permiso…" />;

  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name={recurso === 'camara' ? 'camera-outline' : 'notifications-outline'}
        size={tamanios.iconoGrande}
        color={colores.primario}
      />
      <Text style={estilos.titulo}>{textos.titulo}</Text>
      <Text style={estilos.texto}>
        {estado === 'bloqueado' ? textos.bloqueado : textos.beneficio}
      </Text>
      {estado === 'bloqueado' ? (
        <Boton texto="Abrir Ajustes" icono="settings-outline" onPress={abrirAjustes} />
      ) : (
        <Boton texto="Continuar" onPress={estado === 'concedido' ? volver : continuar} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  texto: {
    fontSize: tamanios.texto,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
