import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Surah, Qari } from '@/services/quranApi';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

interface FeaturedCardProps {
    surah: Surah;
    qari: Qari;
    onPress: () => void;
    onPressPlay?: () => void;
    onPressNext?: () => void;
    isPlaying?: boolean;
    position?: number;
    duration?: number;
}

const WAVE_BARS = [8, 14, 20, 10, 16, 12, 22, 16, 24, 18, 12, 18, 22, 14, 10, 16, 20, 12, 16, 8];

export const FeaturedCard: React.FC<FeaturedCardProps> = ({
    surah,
    qari,
    onPress,
    onPressPlay,
    onPressNext,
    isPlaying,
    position = 0,
    duration = 0,
}) => {
    const formatTime = (millis: number) => {
        if (!millis) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/Masjid.jpg')}
                style={styles.bgImage}
                imageStyle={{ borderRadius: 26 }}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(16, 38, 34, 0.45)', 'rgba(8, 22, 19, 0.88)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.35, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.topContent}>
                        <Text style={styles.label}>Lanjutkan Mendengarkan</Text>
                        <Text style={styles.title} numberOfLines={1}>{surah.englishName}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>{qari.name}</Text>
                    </View>

                    <View style={styles.bottomSection}>
                        <View style={styles.controlsRow}>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={onPressPlay || onPress}
                                activeOpacity={0.85}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={22}
                                    color="#0B1C1A"
                                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                                />
                            </TouchableOpacity>

                            <View style={styles.waveform}>
                                {WAVE_BARS.map((barHeight, i) => {
                                    const barPct = (i / WAVE_BARS.length) * 100;
                                    const isActive = isPlaying && barPct <= progressPercent;
                                    return (
                                        <View
                                            key={i}
                                            style={[
                                                styles.waveBar,
                                                {
                                                    height: barHeight,
                                                    opacity: isActive ? 1 : 0.45,
                                                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                                                }
                                            ]}
                                        />
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={styles.controlsRight}
                                onPress={onPressNext}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>
                                {formatTime(position)} / {formatTime(duration)}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 215,
        marginHorizontal: Spacing.pagePadding,
        borderRadius: 26,
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        elevation: 8,
    },
    bgImage: {
        flex: 1,
        borderRadius: 26,
    },
    gradient: {
        flex: 1,
        borderRadius: 26,
        padding: 22,
        justifyContent: 'space-between',
    },
    topContent: {
        justifyContent: 'flex-start',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.text,
        marginBottom: 6,
        letterSpacing: Typography.tracking.subhead,
    },
    title: {
        color: '#FFFFFF',
        fontSize: Typography.size.title1,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        marginBottom: 4,
        letterSpacing: Typography.tracking.tight,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
    },
    bottomSection: {
        width: '100%',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    waveform: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        paddingHorizontal: 12,
        gap: 3,
    },
    waveBar: {
        width: 3,
        borderRadius: 1.5,
    },
    controlsRight: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeContainer: {
        alignItems: 'flex-end',
        marginTop: 4,
        paddingRight: 6,
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: Typography.size.caption1,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
        letterSpacing: 0.2,
    },
});
