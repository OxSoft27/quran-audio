import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
          {/* Official Siri Icon */}
          <View style={styles.siriIconWrapper}>
            <Image
              source={require('@/assets/images/siri_icon.png')}
              style={styles.siriIcon}
              resizeMode="contain"
            />
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
  siriIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
