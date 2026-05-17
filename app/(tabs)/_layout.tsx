import { MiniPlayer } from '@/components/MiniPlayer';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].tint,
          tabBarInactiveTintColor: Colors[theme].tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors[theme].background,
            borderTopColor: Colors[theme].border,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorit',
            tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="foryou"
          options={{
            title: 'Untukmu',
            tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Pengaturan',
            tabBarIcon: ({ color }) => <Ionicons name="settings-sharp" size={24} color={color} />,
          }}
        />
      </Tabs>
      <MiniPlayer />
    </>
  );
}
