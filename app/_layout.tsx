import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/financeStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const { hasOnboarded, init } = useFinanceStore();
  // const hasOnboarded = false; // FOR TESTING: Always show onboarding
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      init().then(() => {
        SplashScreen.hideAsync();
        setIsReady(true);
      });
    }
  }, [loaded]);

  useEffect(() => {
    if (!isReady) return;

    // Check if onboarded
    // If not onboarded and not currently on onboarding screen, redirect
    const inOnboarding = segments[0] === 'onboarding';

    if (!hasOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasOnboarded && inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [isReady, hasOnboarded, segments]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-transaction" options={{ presentation: 'modal', headerTitle: '', headerTransparent: true, contentStyle: { backgroundColor: '#000000' } }} />
          <Stack.Screen name="add-category" options={{ presentation: 'modal', headerTitle: '', headerTransparent: true, headerShown: true, contentStyle: { backgroundColor: '#000000' } }} />
          <Stack.Screen name="category-management" options={{ presentation: 'modal', headerShown: true, headerTransparent: true, headerTitle: "" }} />
          <Stack.Screen name="transaction-detail" options={{ presentation: 'modal', headerShown: true, headerTransparent: true, headerTitle: "" }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'formSheet',
              headerShown: true,
              headerTransparent: true,
              contentStyle: { backgroundColor: 'transparent' },
              sheetAllowedDetents: [0.5, 1.0],
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              sheetInitialDetentIndex: 0,
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
