import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { requestNotificationPermissions } from '@/services/notificationService';

const { width, height } = Dimensions.get('window');
// Calculate responsive frame dimensions based on screen height
const isSmallScreen = height < 750;
const frameWidth = Math.min(width * 0.78, 305);
const frameHeight = isSmallScreen ? 370 : 420;

export default function NotificationsScreen() {
  const router = useRouter();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const finishOnboarding = async (enabled: boolean = false) => {
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      await AsyncStorage.setItem('notifications_enabled', enabled ? 'true' : 'false');
    } catch (e) {
      console.log('Failed to save onboarding status', e);
    }
    router.replace('/(tabs)');
  };

  const handleEnableNotifications = () => {
    // Show iOS system style notification prompt matching IMG_7685.PNG
    setShowPermissionModal(true);
  };

  const handlePermissionResponse = async (granted: boolean) => {
    setShowPermissionModal(false);
    if (granted) {
      try {
        await requestNotificationPermissions();
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    await finishOnboarding(granted);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#04091C', '#060F2A', '#02050E']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <BlurView intensity={35} tint="light" style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Tetap konsisten</Text>
        </View>

        {/* iPhone Lock Screen Mockup (Matching IMG_7684.PNG) */}
        <View style={styles.mockupWrapper}>
          {/* Titanium Outer Frame */}
          <View style={[styles.deviceFrame, { width: frameWidth, height: frameHeight }]}>
            {/* Inner Black Bezel */}
            <View style={styles.innerBezel}>
              {/* Screen Wallpaper */}
              <LinearGradient
                colors={['#172C3E', '#2A4A5D', '#638A9A', '#9EC0CA', '#587D8F', '#243C4B']}
                locations={[0, 0.25, 0.5, 0.68, 0.85, 1]}
                style={styles.deviceScreen}
              >
                {/* Dynamic Island */}
                <View style={styles.dynamicIslandRow}>
                  <View style={styles.dynamicIsland}>
                    <View style={styles.cameraLens} />
                  </View>
                  {/* Status Bar Icons */}
                  <View style={styles.statusBarIcons}>
                    <Ionicons name="cellular" size={11} color="rgba(255,255,255,0.9)" style={{ marginRight: 3 }} />
                    <Ionicons name="wifi" size={11} color="rgba(255,255,255,0.9)" style={{ marginRight: 4 }} />
                    <View style={styles.batteryPill}>
                      <Text style={styles.batteryText}>69</Text>
                    </View>
                  </View>
                </View>

                {/* Lock Icon */}
                <View style={styles.lockIconContainer}>
                  <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.95)" />
                </View>

                {/* Day & Date */}
                <Text style={styles.lockDateText}>Fri Apr 24</Text>

                {/* iOS Large Translucent Clock */}
                <Text style={styles.lockClockText}>09:00</Text>

                {/* Floating Frosted Glass Notification Card */}
                <View style={styles.notificationCardWrapper}>
                  <BlurView intensity={75} tint="light" style={styles.notificationBlur}>
                    {/* App Icon */}
                    <View style={styles.notificationAppIcon}>
                      <Ionicons name="moon" size={16} color="#FFFFFF" />
                    </View>

                    {/* Notification Texts */}
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTopRow}>
                        <Text style={styles.notificationSender} numberOfLines={1}>
                          🕊 From the Prophet (ﷺ)
                        </Text>
                        <Text style={styles.notificationTime}>now</Text>
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={3}>
                        Whoever recites Surah Al-Kahf on Friday is blessed with light until the next Friday.
                      </Text>
                    </View>
                  </BlurView>
                </View>

                {/* Bottom Screen Fade Shadow */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.bottomScreenFade}
                />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.footerSection}>
          <Text style={styles.footerDescription}>
            Pengingat lembut untuk membantumu tetap konsisten dengan Al-Qur'an setiap hari
          </Text>

          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnableNotifications}
            activeOpacity={0.85}
          >
            <Text style={styles.enableButtonText}>Aktifkan notifikasi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => finishOnboarding(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Mungkin nanti</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* iOS Notification System Dialog (Matching IMG_7685.PNG) */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.alertOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>
              "QuranFlow" Ingin Mengirimi Anda Pemberitahuan
            </Text>

            <Text style={styles.alertMessage}>
              Pemberitahuan dapat meliputi peringatan, bunyi, dan tanda ikon. Pemberitahuan ini dapat dikonfigurasi di Pengaturan.
            </Text>

            <View style={styles.alertButtonGroup}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => handlePermissionResponse(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.alertButtonText}>Jangan Izinkan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonConfirm]}
                onPress={() => handlePermissionResponse(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonConfirmText]}>Izinkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04091C',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: Spacing.pagePadding,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: Typography.size.largeTitle,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mockupWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 4,
  },
  deviceFrame: {
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#424A5E',
    backgroundColor: '#0A0C14',
    padding: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.75,
    shadowRadius: 28,
    elevation: 16,
  },
  innerBezel: {
    flex: 1,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  deviceScreen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  dynamicIslandRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 26,
    position: 'relative',
  },
  dynamicIsland: {
    width: 76,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 7,
  },
  cameraLens: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0D1424',
    borderWidth: 1,
    borderColor: '#18243C',
  },
  statusBarIcons: {
    position: 'absolute',
    right: 8,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryPill: {
    width: 20,
    height: 11,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockIconContainer: {
    marginTop: isSmallScreen ? 12 : 20,
    marginBottom: 4,
  },
  lockDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  lockClockText: {
    fontSize: isSmallScreen ? 58 : 68,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.78)',
    letterSpacing: -2,
    lineHeight: isSmallScreen ? 62 : 72,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  notificationCardWrapper: {
    width: '100%',
    marginTop: isSmallScreen ? 24 : 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  notificationBlur: {
    flexDirection: 'row',
    padding: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'flex-start',
  },
  notificationAppIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#161C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notificationSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
  },
  notificationTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    marginLeft: 4,
  },
  notificationMessage: {
    fontSize: 11.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.94)',
    fontWeight: '400',
  },
  bottomScreenFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  footerSection: {
    paddingHorizontal: Spacing.pagePadding,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    alignItems: 'center',
  },
  footerDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  enableButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonText: {
    fontSize: Typography.size.callout,
    fontWeight: 'bold',
    color: '#000000',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: Typography.size.footnote,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weight.medium,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.pagePadding,
  },
  alertCard: {
    width: Math.min(width * 0.85, 340),
    borderRadius: 26,
    padding: 24,
    backgroundColor: 'rgba(242, 244, 248, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  alertTitle: {
    fontSize: Typography.size.headline,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  alertMessage: {
    fontSize: Typography.size.footnote,
    color: 'rgba(0, 0, 0, 0.72)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  alertButtonGroup: {
    gap: 10,
  },
  alertButton: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonConfirm: {
    backgroundColor: '#000000',
  },
  alertButtonText: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: '#000000',
  },
  alertButtonConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

