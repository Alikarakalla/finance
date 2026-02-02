import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
// @ts-ignore
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs backBehavior="history">
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="transactions">
          <Label>Activity</Label>
          <Icon sf="list.bullet" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="scan">
          <Label>Scan</Label>
          <Icon sf="camera.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="budget">
          <Label>Budget</Label>
          <Icon sf="chart.pie.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings" role="search">
          <Label>Settings</Label>
          <Icon sf="gearshape.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[theme].tint,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopColor: theme === 'dark' ? '#333' : '#eee',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <MaterialIcons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <MaterialIcons name="camera-alt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <MaterialIcons name="pie-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
