import { AudioProvider, useAudio } from '@/context/AudioContext';
import { DownloadProvider } from '@/context/DownloadContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { executeDirectPlayback, parseDeepLinkUrl, parseNotificationResponse } from '@/services/deepLinkHandler';
import '@/services/i18n';
import { initializeAdMob } from '@/services/adMobService';
import { refreshNotificationSchedule } from '@/services/notificationService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, Stack, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

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
    initializeAdMob();
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

  // Stable references for async event callbacks
  const playSurahRef = useRef(playSurah);
  useEffect(() => {
    playSurahRef.current = playSurah;
  }, [playSurah]);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!hasCompletedOnboarding) {
      // Small timeout ensures the stack is fully registered before replacing
      setTimeout(() => {
        router.replace('/(onboarding)/01-select-qari');
      }, 0);
    }
  }, [hasCompletedOnboarding, rootNavigationState?.key, router]);

  // Cold start notification & deep link check (executes strictly ONCE on startup)
  const isColdStartCheckedRef = useRef(false);
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isColdStartCheckedRef.current) return;
    isColdStartCheckedRef.current = true;

    // 1. Refresh notification schedule & sync widget daily verse
    refreshNotificationSchedule();

    // 2. Handle cold start (check notification first; only check initialURL if not from notification)
    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (response) {
        const payload = parseNotificationResponse(response);
        if (payload && playSurahRef.current && routerRef.current) {
          await executeDirectPlayback(payload, playSurahRef.current, routerRef.current);
          return;
        }
      }
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && playSurahRef.current && routerRef.current) {
        const payload = parseDeepLinkUrl(initialUrl, true);
        if (payload) {
          await executeDirectPlayback(payload, playSurahRef.current, routerRef.current);
        }
      }
    }).catch((err) => {
      console.warn('[RootLayoutNav] Error checking initial notification response:', err);
    });
  }, [rootNavigationState?.key]);

  // Runtime event listeners (mounted ONCE for lifetime of app, uses latest refs)
  useEffect(() => {
    const urlSub = Linking.addEventListener('url', async ({ url }) => {
      const payload = parseDeepLinkUrl(url);
      if (payload && playSurahRef.current && routerRef.current) {
        await executeDirectPlayback(payload, playSurahRef.current, routerRef.current);
      }
    });

    const notifSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const payload = parseNotificationResponse(response);
      if (payload && playSurahRef.current && routerRef.current) {
        await executeDirectPlayback(payload, playSurahRef.current, routerRef.current);
      }
    });

    return () => {
      urlSub.remove();
      notifSub.remove();
    };
  }, []);

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
