import { DownloadProvider } from '@/context/DownloadContext';
import { AudioProvider } from '@/context/AudioContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '@/services/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useAudio } from '@/context/AudioContext';
import { refreshNotificationSchedule } from '@/services/notificationService';
import { parseDeepLinkUrl, parseNotificationResponse, executeDirectPlayback } from '@/services/deepLinkHandler';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    'AmiriQuran': require('@/assets/fonts/AmiriQuran-Regular.ttf'),
    'Amiri-Bold': require('@/assets/fonts/Amiri-Bold.ttf'),
  });
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isSplashFinished, setIsSplashFinished] = useState<boolean>(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('has_completed_onboarding');
        setHasCompletedOnboarding(value === 'true');
      } catch (e) {
        setHasCompletedOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && hasCompletedOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hasCompletedOnboarding]);

  if (!loaded || hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <DownloadProvider>
          <AudioProvider>
            <FavoritesProvider>
              <PlaylistProvider>
                <RootLayoutNav hasCompletedOnboarding={hasCompletedOnboarding} />
                {!isSplashFinished && (
                  <AnimatedSplashScreen onAnimationComplete={() => setIsSplashFinished(true)} />
                )}
              </PlaylistProvider>
            </FavoritesProvider>
          </AudioProvider>
        </DownloadProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav({ hasCompletedOnboarding }: { hasCompletedOnboarding: boolean }) {
  const { theme } = useTheme();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { playSurah } = useAudio();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!hasCompletedOnboarding) {
      // Small timeout ensures the stack is fully registered before replacing
      setTimeout(() => {
        router.replace('/(onboarding)/01-select-qari');
      }, 0);
    }
  }, [hasCompletedOnboarding, rootNavigationState?.key]);

  // Deep Linking & Notification Response Listener
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    // 1. Refresh notification schedule & sync widget daily verse
    refreshNotificationSchedule();

    // 2. Handle deep linking when app is open
    const urlSub = Linking.addEventListener('url', async ({ url }) => {
      const payload = parseDeepLinkUrl(url);
      if (payload) {
        await executeDirectPlayback(payload, playSurah, router);
      }
    });

    // 3. Handle deep link from cold start
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        const payload = parseDeepLinkUrl(url);
        if (payload) {
          await executeDirectPlayback(payload, playSurah, router);
        }
      }
    });

    // 4. Handle notification response while app is running/background
    const notifSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const payload = parseNotificationResponse(response);
      if (payload) {
        await executeDirectPlayback(payload, playSurah, router);
      }
    });

    // 5. Handle cold start notification response
    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (response) {
        const payload = parseNotificationResponse(response);
        if (payload) {
          await executeDirectPlayback(payload, playSurah, router);
        }
      }
    });

    return () => {
      urlSub.remove();
      notifSub.remove();
    };
  }, [rootNavigationState?.key, playSurah, router]);

  return (
    <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player/fullscreen"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="premium-challenge"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="all-qaris" options={{ headerShown: false }} />
      </Stack>
    </NavThemeProvider>
  );
}
