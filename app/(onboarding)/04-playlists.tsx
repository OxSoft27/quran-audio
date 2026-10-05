import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const PLAYLISTS = [
  { id: 'fav', name: 'Favorit', icon: 'heart', color: '#E91E63' },
  { id: 'focus', name: 'Fokus & Kerja', icon: 'crosshairs', color: '#2196F3' },
  { id: 'beauty', name: 'Bacaan Terindah', icon: 'star', color: '#FFC107' },
  { id: 'sleep', name: 'Pengatur Tidur', icon: 'moon-o', color: '#9C27B0' },
];

export default function PlaylistsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleContinue = () => {
    router.push('/(onboarding)/05-daily-goal');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Playlist Pilihan</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
          Temukan koleksi audio Al-Qur'an untuk setiap momen Anda.
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.gridContainer}>
        {PLAYLISTS.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: item.color }]}>
            <FontAwesome name={item.icon as any} size={40} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Lanjutkan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.pagePadding,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.pagePadding,
    alignItems: 'center',
  },
  title: {
    ...Typography.preset.title1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.body,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    padding: Spacing.pagePadding,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: Spacing.pagePadding - Spacing.xs,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    top: Spacing.pagePadding,
    right: Spacing.pagePadding,
    opacity: 0.8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.body,
    fontWeight: 'bold',
  },
  footer: {
    padding: Spacing.pagePadding,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    backgroundColor: '#1DB8B5',
    paddingVertical: Spacing.lg,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: Typography.size.body,
    fontWeight: 'bold',
  },
});
