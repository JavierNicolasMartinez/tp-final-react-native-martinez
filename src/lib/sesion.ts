import { CLAVE_PERSONAL, USUARIO_PERSONAL } from '../constants/personal';

export function credencialesValidas(usuario: string, clave: string): boolean {
  return usuario.trim().toLowerCase() === USUARIO_PERSONAL && clave === CLAVE_PERSONAL;
}
