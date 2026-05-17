import { AudioProvider } from '@/context/AudioContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AudioProvider>
        <FavoritesProvider>
          <PlaylistProvider>
            <RootLayoutNav />
          </PlaylistProvider>
        </FavoritesProvider>
      </AudioProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player/fullscreen"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}
