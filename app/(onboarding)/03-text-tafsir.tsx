import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TextTafsirScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleContinue = () => {
    router.push('/(onboarding)/04-playlists');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Teks Al-Qur'an & Tafsir</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            Gunakan ayat ke ayat tersinkronisasi terjemahan
          </Text>
        </View>

        <View style={[styles.mockupContainer, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', borderColor: isDark ? '#333333' : '#E0E0E0' }]}>
          <View style={styles.mockupHeader}>
            <Text style={[styles.mockupSurah, { color: isDark ? '#FFFFFF' : '#000000' }]}>Al-Fatihah</Text>
            <FontAwesome name="ellipsis-h" size={20} color={isDark ? '#AAAAAA' : '#666666'} />
          </View>
          
          <View style={styles.mockupVerse}>
            <Text style={[styles.arabicText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
            </Text>
            <Text style={[styles.translationText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
            </Text>
          </View>

          <View style={[styles.mockupVerse, { opacity: 0.5 }]}>
            <Text style={[styles.arabicText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
            </Text>
            <Text style={[styles.translationText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Segala puji bagi Allah, Tuhan seluruh alam.
            </Text>
          </View>
          
          <View style={styles.mockupPlayer}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}>
              <View style={[styles.progressFill, { backgroundColor: '#1DB8B5', width: '30%' }]} />
            </View>
            <View style={styles.playerControls}>
              <FontAwesome name="step-backward" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <FontAwesome name="play-circle" size={48} color="#1DB8B5" />
              <FontAwesome name="step-forward" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
          </View>
        </View>
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.pagePadding,
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
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
  mockupContainer: {
    width: '100%',
    borderRadius: Spacing.pagePadding - Spacing.xs,
    borderWidth: 1,
    padding: Spacing.pagePadding,
    overflow: 'hidden',
  },
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  mockupSurah: {
    fontSize: Typography.size.body,
    fontWeight: 'bold',
  },
  mockupVerse: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  arabicText: {
    fontSize: Typography.size.largeTitle,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 50,
  },
  translationText: {
    fontSize: Typography.size.subhead,
    textAlign: 'center',
  },
  mockupPlayer: {
    marginTop: Spacing.pagePadding,
  },
  progressBar: {
    height: Spacing.xs,
    borderRadius: 2,
    marginBottom: Spacing.pagePadding,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
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
