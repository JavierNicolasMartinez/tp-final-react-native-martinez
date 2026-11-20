import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type Props = {
  nombre: ComponentProps<typeof Ionicons>['name'];
  tamanio: number;
  color: string;
};

// Ícono que acompaña a un texto o a un botón con etiqueta: el lector de pantalla lo saltea.
export function IconoDecorativo({ nombre, tamanio, color }: Props) {
  return (
    <Ionicons
      name={nombre}
      size={tamanio}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
