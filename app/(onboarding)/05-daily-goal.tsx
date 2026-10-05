import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DailyGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [minutes, setMinutes] = useState(5);

  const increment = () => setMinutes(prev => Math.min(prev + 5, 120));
  const decrement = () => setMinutes(prev => Math.max(prev - 5, 5));

  const formatTime = (mins: number) => {
    const mm = mins.toString().padStart(2, '0');
    return `${mm}:00`;
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('daily_goal_minutes', minutes.toString());
    } catch (e) {
      console.log('Failed to save goal', e);
    }
    router.push('/(onboarding)/06-notifications');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="headphones" size={60} color="#1DB8B5" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Ganti musik dengan firman Allah
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
          Berapa lama Anda ingin mendengarkan Al-Qur'an setiap harinya?
        </Text>

        <View style={styles.timerContainer}>
          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]} 
            onPress={decrement}
            disabled={minutes <= 5}
          >
            <FontAwesome name="minus" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>

          <Text style={[styles.timerText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {formatTime(minutes)}
          </Text>

          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]} 
            onPress={increment}
            disabled={minutes >= 120}
          >
            <FontAwesome name="plus" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.unitText, { color: isDark ? '#AAAAAA' : '#666666' }]}>Menit / Hari</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Atur minimum harian</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing['3xl'],
    width: 120,
    height: 120,
    borderRadius: Spacing['6xl'] - Spacing.xs,
    backgroundColor: 'rgba(29, 184, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.preset.title1,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['5xl'],
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  timerButton: {
    width: Spacing['6xl'] - Spacing.xs,
    height: Spacing['6xl'] - Spacing.xs,
    borderRadius: Spacing['2xl'] - Spacing.xs + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    ...Typography.preset.display,
    marginHorizontal: Spacing['2xl'],
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: Typography.size.body,
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
