import { CustomBottomTabBar } from '@/components/CustomBottomTabBar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { AdBannerComponent } from '@/components/AdBannerComponent';
import { TabBarAnimationProvider } from '@/context/TabBarAnimationContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bannerBottom = Math.max(insets.bottom, 12) + 64 + 6;

  return (
    <TabBarAnimationProvider>
      <Tabs
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home', 'Beranda'),
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="qari"
          options={{
            title: t('tabs.qari', 'Qari'),
            tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="playlist"
          options={{
            title: t('tabs.playlist', 'Daftar Putar'),
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings', 'Pengaturan'),
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-sharp" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="foryou"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <AdBannerComponent bottomOffset={bannerBottom} />
      <MiniPlayer />
    </TabBarAnimationProvider>
  );
}
