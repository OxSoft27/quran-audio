import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';

interface SiriPermissionModalProps {
  visible: boolean;
  onDismiss: (granted: boolean) => void;
}

const { width } = Dimensions.get('window');

export const SiriPermissionModal: React.FC<SiriPermissionModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDark
                ? 'rgba(38, 40, 44, 0.92)'
                : 'rgba(235, 238, 242, 0.94)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Siri Glowing Icon */}
          <View style={styles.siriIconWrapper}>
            <LinearGradient
              colors={['#0F0F14', '#1A1C24']}
              style={styles.siriIconBase}
            >
              <LinearGradient
                colors={['#FF3B70', '#A259FF', '#38E1FF', '#4BD1A0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.siriOrb}
              >
                <View style={styles.siriInnerCore}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#111111' },
            ]}
          >
            Apakah Anda ingin menggunakan "QuranFlow" dengan Siri?
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.68)' },
            ]}
          >
            Sebagian data QuranFlow Anda akan dikirimkan ke Apple untuk memproses permintaan Anda.
          </Text>

          <Text
            style={[
              styles.subDescription,
              { color: isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.68)' },
            ]}
          >
            QuranFlow menggunakan Siri untuk memutar surah, qori, dan koleksi lewat suara.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.06)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
              onPress={() => onDismiss(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Jangan Izinkan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.18)'
                    : 'rgba(0, 0, 0, 0.12)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.22)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              onPress={() => onDismiss(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.confirmButtonText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                Izinkan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: Spacing.pagePadding,
  },
  dialogContainer: {
    width: Math.min(width * 0.88, 350),
    borderRadius: 28,
    padding: Spacing.xl + 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  siriIconWrapper: {
    marginBottom: Spacing.md,
  },
  siriIconBase: {
    width: 54,
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  siriOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  siriInnerCore: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(10, 10, 20, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size.headline,
    fontWeight: Typography.weight.bold,
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
    textAlign: 'left',
  },
  description: {
    fontSize: Typography.size.footnote,
    lineHeight: 20,
    marginBottom: Spacing.sm,
    textAlign: 'left',
  },
  subDescription: {
    fontSize: Typography.size.footnote,
    lineHeight: 20,
    marginBottom: Spacing.xl,
    textAlign: 'left',
  },
  buttonGroup: {
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
  },
  confirmButtonText: {
    fontWeight: Typography.weight.bold,
  },
});
