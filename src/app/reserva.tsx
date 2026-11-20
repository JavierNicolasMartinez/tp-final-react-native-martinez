import { Redirect } from 'expo-router';

// URL vieja de la versión anterior: se manda directo a /reservas.
export default function ReservaVieja() {
  return <Redirect href="/reservas" />;
}
