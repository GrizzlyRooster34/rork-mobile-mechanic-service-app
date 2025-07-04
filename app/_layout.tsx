import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { useHydrateConfig } from '@/hooks/useHydrateConfig';

export const unstable_settings = {
  initialRouteName: 'auth',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function AppContent() {
  const [loaded, error] = useFonts({});
  
  // Hydrate config store with backend settings on app startup
  // Disable for now to prevent blocking app startup
  // const { isHydrated, error: configError } = useHydrateConfig();

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Commented out config hydration to prevent blocking
  // useEffect(() => {
  //   if (configError) {
  //     console.warn('Config hydration failed, using defaults:', configError);
  //   } else if (isHydrated) {
  //     console.log('Config successfully hydrated from backend');
  //   }
  // }, [isHydrated, configError]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(mechanic)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}