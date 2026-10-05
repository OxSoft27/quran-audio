import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Easing,
  StatusBar,
  useColorScheme,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number; // Total display duration in ms before starting fade out
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
  duration = 1400,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic colors based on device Dark/Light mode setting
  const bgColor = isDark ? '#0B1615' : '#FFFFFF';
  const titleColor = isDark ? '#FFFFFF' : '#111827';
  const taglineColor = isDark ? '#1DB8B5' : '#009DA6';
  const glowColor = isDark ? '#1DB8B5' : '#00C4D2';
  const glowOpacity = isDark ? 0.08 : 0.05;
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // 2. Exit animation after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => {
        setIsVisible(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: containerOpacity,
        },
      ]}
      pointerEvents="none"
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={bgColor} />

      {/* Decorative ambient background glow */}
      <View style={[styles.ambientGlow, { backgroundColor: glowColor, opacity: glowOpacity }]} />

      {/* Center Branding Content */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              shadowColor: isDark ? '#1DB8B5' : '#009DA6',
            },
          ]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={[styles.appName, { color: titleColor }]}>QuranFlow</Text>
          <Text style={[styles.appTagline, { color: taglineColor }]}>Lantunan Murottal & Kedamaian Hati</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B1615', // Premium dark emerald matching app theme
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Render on top of everything
    elevation: 99999,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: '#1DB8B5',
    opacity: 0.08,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#1DB8B5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#009DA6',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1DB8B5',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
