import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { QARIS } from '@/services/quranApi';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/context/SubscriptionContext';

export interface MiniPlayerProps {
    hasTabBar?: boolean;
    bottomOffset?: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ hasTabBar = true, bottomOffset }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { currentTrack, isPlaying, togglePlayPause, playNext, position, duration } = useAudio();
    const { miniPlayerAnimatedStyle } = useTabBarAnimation();
    const router = useRouter();
    const { isPremium } = useSubscription();

    if (!currentTrack) return null;

    const progress = duration > 0 ? position / duration : 0;

    const handlePress = () => {
        router.push('/player/fullscreen');
    };

    // Find the qari artwork
    const qari = QARIS.find(q => q.id === currentTrack.qariId);
    const artworkSource = qari?.image || require('@/assets/images/qaris/mishary.png');

    // Floating position:
    // With tab bar: CustomBottomTabBar is at Math.max(insets.bottom, 12) with height 64 + 10px margin.
    // If not premium, float smoothly above the ad banner (56px)
    const adOffset = !isPremium && hasTabBar ? 56 : 0;
    const defaultBottom = hasTabBar
        ? Math.max(insets.bottom, 12) + 64 + 10 + adOffset
        : Math.max(insets.bottom, 14);

    const bottomPosition = bottomOffset !== undefined ? bottomOffset : defaultBottom;

    return (
        <Animated.View style={[
            styles.wrapper,
            {
                bottom: bottomPosition,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                shadowOpacity: isDark ? 0.35 : 0.1,
            },
            hasTabBar ? miniPlayerAnimatedStyle : undefined,
        ]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.92} style={styles.touchable}>
                <BlurView
                    intensity={isDark ? 75 : 90}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                        styles.blurContainer,
                        { backgroundColor: isDark ? 'rgba(20, 20, 22, 0.55)' : 'rgba(255, 255, 255, 0.82)' },
                    ]}
                >
                    <View style={styles.content}>
                        {/* Artwork Avatar */}
                        <View style={styles.artworkContainer}>
                            <Image
                                source={artworkSource}
                                style={styles.artwork}
                                resizeMode="cover"
                            />
                        </View>

                        {/* Title & Reciter */}
                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.title,
                                    { color: isDark ? '#FFFFFF' : '#111827' },
                                ]}
                                numberOfLines={1}
                            >
                                {currentTrack.surahNumber ? `${currentTrack.surahNumber}. ${currentTrack.surahName}` : currentTrack.surahName}
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)' },
                                ]}
                                numberOfLines={1}
                            >
                                {currentTrack.qariName}
                            </Text>
                        </View>

                        {/* Controls */}
                        <View style={styles.controlsContainer}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    togglePlayPause();
                                }}
                                style={styles.controlButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={20}
                                    color={isDark ? "#FFFFFF" : "#111827"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    playNext();
                                }}
                                style={styles.controlButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="play-skip-forward"
                                    size={18}
                                    color={isDark ? "#FFFFFF" : "#111827"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Thin Progress Bar */}
                    <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress * 100}%`,
                                    backgroundColor: isDark ? '#FFFFFF' : '#10B981',
                                }
                            ]}
                        />
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 14,
        right: 14,
        height: 64,
        borderRadius: 32,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 60,
    },
    touchable: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        overflow: 'hidden',
    },
    blurContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    artworkContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        backgroundColor: '#2A2A2A',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginRight: 10,
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 4,
    },
    title: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
    },
    subtitle: {
        fontSize: Typography.size.caption2,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        marginTop: 1,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    controlButton: {
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    progressFill: {
        height: '100%',
    },
});
