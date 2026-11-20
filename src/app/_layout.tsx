import { Stack } from 'expo-router';

export default function LayoutRaiz() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Biblioteca IPF' }} />
    </Stack>
  );
}
