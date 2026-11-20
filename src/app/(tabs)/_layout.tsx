import { Tabs } from 'expo-router/js-tabs';

import { IconoTab } from '../../components/IconoTab';
import { opcionesTabs } from '../../constants/navegacion';

export default function LayoutTabs() {
  return (
    <Tabs screenOptions={opcionesTabs}>
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="library-outline" activa={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="bookmark-outline" activa={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
