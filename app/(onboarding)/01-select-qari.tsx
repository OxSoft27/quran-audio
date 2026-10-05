import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { QARIS } from '@/services/quranApi';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useFavorites } from '@/context/FavoritesContext';
import { SiriPermissionModal } from '@/components/SiriPermissionModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectQariScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setFavoriteQaris } = useFavorites();
  const isDark = theme === 'dark';
  const [selectedQaris, setSelectedQaris] = useState<string[]>([]);
  const [showSiriModal, setShowSiriModal] = useState(false);

  const toggleQari = (id: string) => {
    setSelectedQaris(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedQaris.length > 0) {
      await setFavoriteQaris(selectedQaris);
    }
    // Show Siri permission dialog like in IMG_7676.PNG
    setShowSiriModal(true);
  };

  const handleSiriDismiss = async (granted: boolean) => {
    try {
      await AsyncStorage.setItem('siri_enabled', granted ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving siri preference', e);
    }
    setShowSiriModal(false);
    router.push('/(onboarding)/02-ambient-sounds');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Pilih qari favorit Anda</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
          Anda dapat memilih beberapa Qari. Pilihan ini akan menyesuaikan rekomendasi kami.
        </Text>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {QARIS.map(qari => {
          const isSelected = selectedQaris.includes(qari.id);
          return (
            <TouchableOpacity 
              key={qari.id} 
              style={[
                styles.qariItem, 
                { 
                  backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                  borderColor: isSelected ? '#1DB8B5' : (isDark ? '#333333' : '#E0E0E0'),
                  borderWidth: isSelected ? 2 : 1
                }
              ]}
              onPress={() => toggleQari(qari.id)}
              activeOpacity={0.7}
            >
              <View style={styles.qariInfo}>
                {qari.image ? (
                  <Image source={qari.image} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}>
                    <Text style={[styles.avatarText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {qari.name.charAt(0)}
                    </Text>
                  </View>
                )}
                <Text style={[styles.qariName, { color: isDark ? '#FFFFFF' : '#000000' }]}>{qari.name}</Text>
              </View>
              
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: isSelected ? '#1DB8B5' : (isDark ? '#666666' : '#999999'),
                  backgroundColor: isSelected ? '#1DB8B5' : 'transparent'
                }
              ]}>
                {isSelected && <FontAwesome name="check" size={12} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        <Text style={[styles.footerNote, { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)' }]}>
          50+ suara untuk memperdalam hubunganmu dengan Al-Qur'an
        </Text>
        <TouchableOpacity 
          style={[
            styles.button, 
            { 
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
              opacity: selectedQaris.length > 0 ? 1 : 0.4 
            }
          ]} 
          onPress={handleContinue}
          disabled={selectedQaris.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Pilih</Text>
        </TouchableOpacity>
      </View>

      {/* Siri Permission Modal from IMG_7676.PNG */}
      <SiriPermissionModal
        visible={showSiriModal}
        onDismiss={handleSiriDismiss}
      />
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
  },
  title: {
    ...Typography.preset.title1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.body,
    lineHeight: 24,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.pagePadding,
    paddingBottom: Spacing.pagePadding,
  },
  qariItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Spacing.md,
    marginBottom: Spacing.md,
  },
  qariInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: Spacing.pagePadding - Spacing.xs,
    marginRight: Spacing.lg,
  },
  avatarPlaceholder: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: Spacing.pagePadding - Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: Typography.size.body,
    fontWeight: 'bold',
  },
  qariName: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
  },
  checkbox: {
    width: Spacing.pagePadding,
    height: Spacing.pagePadding,
    borderRadius: Spacing.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: Spacing.pagePadding,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerNote: {
    fontSize: Typography.size.caption1,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 18,
    fontWeight: Typography.weight.medium,
  },
  button: {
    paddingVertical: Spacing.lg - 2,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.size.callout,
    fontWeight: 'bold',
  },
});
