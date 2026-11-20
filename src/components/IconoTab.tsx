import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colores } from '../constants/tema';

type Props = {
  nombre: ComponentProps<typeof Ionicons>['name'];
  activa: boolean;
  size: number;
};

export function IconoTab({ nombre, activa, size }: Props) {
  return (
    <Ionicons
      name={nombre}
      color={activa ? colores.primario : colores.textoSecundario}
      size={size}
    />
  );
}
