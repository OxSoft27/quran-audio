import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '@/context/SubscriptionContext';
import { PremiumPaywallModal } from '@/components/PremiumPaywallModal';

const SOUNDS = [
  {
    id: 'fire',
    name: 'Api',
    icon: 'fire',
    audio: require('@/assets/audio/ambient/fireplace.mp3'),
    video: require('@/assets/videos/ambient/fireplace.mp4'),
  },
  {
    id: 'rain',
    name: 'Hujan',
    icon: 'cloud-rain',
    audio: require('@/assets/audio/ambient/rain.mp3'),
    video: require('@/assets/videos/ambient/rain.mp4'),
  },
  {
    id: 'birds',
    name: 'Burung',
    icon: 'dove',
    audio: require('@/assets/audio/ambient/birds.mp3'),
    video: require('@/assets/videos/ambient/birds.mp4'),
  },
  {
    id: 'wind',
    name: 'Angin',
    icon: 'wind',
    audio: require('@/assets/audio/ambient/wind.mp3'),
    video: require('@/assets/videos/ambient/wind.mp4'),
  },
  {
    id: 'waves',
    name: 'Ombak',
    icon: 'water',
    audio: require('@/assets/audio/ambient/ocean.mp3'),
    video: require('@/assets/videos/ambient/ocean.mp4'),
  },
];

export default function AmbientSoundsScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const [selectedSound, setSelectedSound] = useState<string>('rain');
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);

  const currentSound = SOUNDS.find(s => s.id === selectedSound) || SOUNDS[1];

  // Native expo-video player for dynamic background video
  const videoPlayer = useVideoPlayer(currentSound.video, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.showNowPlayingNotification = false;
    p.staysActiveInBackground = false;
    p.play();
  });

  // Native expo-audio player for ambient audio preview
  const audioPlayer = useAudioPlayer(currentSound.audio);

  useEffect(() => {
    if (!currentSound) return;

    if (videoPlayer && currentSound.video) {
      try {
        videoPlayer.replace(currentSound.video);
        videoPlayer.play();
      } catch (e) {
        console.warn('Error updating ambient video:', e);
      }
    }

    if (audioPlayer && currentSound.audio) {
      try {
        audioPlayer.replace(currentSound.audio);
        audioPlayer.loop = true;
        audioPlayer.play();
      } catch (e) {
        console.warn('Error updating ambient audio:', e);
      }
    }
  }, [selectedSound]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioPlayer) audioPlayer.pause();
        if (videoPlayer) videoPlayer.pause();
      } catch (_) {}
    };
  }, []);

  const handleSelectSound = (soundId: string) => {
    // Only 'rain' is accessible for free users
    if (soundId !== 'rain' && !isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsPremiumModalVisible(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSound(soundId);
  };

  const handleContinue = async () => {
    try {
      if (audioPlayer) audioPlayer.pause();
      if (videoPlayer) videoPlayer.pause();
      await AsyncStorage.setItem('selected_ambient', selectedSound);
    } catch (e) {
      console.warn('Error saving ambient preference:', e);
    }
    router.push('/(onboarding)/03-text-tafsir');
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Background Video View */}
      {videoPlayer && (
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      {/* Dark Overlay for content legibility */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Atmosfer Tilawah</Text>
              <Text style={styles.subtitle}>
                Pilih suara latar untuk menemani tilawah Anda agar lebih khusyuk.
              </Text>
            </View>

            <View style={styles.soundsGrid}>
              {SOUNDS.map(sound => {
                const isSelected = selectedSound === sound.id;
                const isLocked = sound.id !== 'rain' && !isPremium;
                return (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundItem,
                      isSelected ? styles.soundItemSelected : styles.soundItemUnselected
                    ]}
                    onPress={() => handleSelectSound(sound.id)}
                    activeOpacity={0.7}
                  >
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color="#F59E0B" />
                      </View>
                    )}
                    <FontAwesome5 
                      name={sound.icon} 
                      size={32} 
                      color={isLocked ? 'rgba(255, 255, 255, 0.65)' : '#FFFFFF'} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Lanjutkan</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Premium Paywall Modal for locked sounds */}
      <PremiumPaywallModal
        visible={isPremiumModalVisible}
        onClose={() => setIsPremiumModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.pagePadding,
    paddingTop: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['5xl'] + Spacing.xs,
  },
  title: {
    ...Typography.preset.title1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 12,
  },
  soundItem: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    zIndex: 10,
  },
  soundItemSelected: {
    backgroundColor: '#1DB8B5',
    borderColor: '#22D3EE',
    borderWidth: 2,
    shadowColor: '#1DB8B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  soundItemUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
  },
  footer: {
    padding: Spacing.pagePadding,
    paddingBottom: Spacing.xl,
  },
  button: {
    backgroundColor: '#1DB8B5',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#1DB8B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
