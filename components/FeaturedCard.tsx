import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Surah, Qari } from '@/services/quranApi';

interface FeaturedCardProps {
    surah: Surah;
    qari: Qari;
    onPress: () => void;
    isPlaying?: boolean;
    position?: number;
    duration?: number;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ surah, qari, onPress, isPlaying, position = 0, duration = 0 }) => {

    const formatTime = (millis: number) => {
        if (!millis) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/banner_bg.png')}
                style={styles.bgImage}
                imageStyle={{ borderRadius: 24 }}
            >
                <LinearGradient
                    colors={['rgba(29, 184, 181, 0.4)', 'rgba(15, 28, 27, 0.8)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <View>
                            <Text style={styles.label}>Lanjutkan Mendengarkan</Text>
                            <Text style={styles.title}>{surah.englishName}</Text>
                            <Text style={styles.subtitle}>{qari.name}</Text>
                        </View>

                        <View style={styles.controls}>
                            <View style={styles.playButton}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#0F1C1B" style={{ marginLeft: isPlaying ? 0 : 3 }} />
                            </View>

                            <View style={styles.progressContainer}>
                                {/* Visual Fake Waveform - now partly dynamic opacities? Or just simple bar */}
                                <View style={styles.waveform}>
                                    {[...Array(20)].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.waveBar,
                                                {
                                                    height: Math.random() * 16 + 4,
                                                    // Simple visual indicator: highlight bars up to completion %
                                                    opacity: (i / 20) * 100 < progressPercent ? 1 : 0.4
                                                }
                                            ]}
                                        />
                                    ))}
                                </View>
                                <View style={styles.timeLabels}>
                                    <Text style={styles.timeText}>{formatTime(position)} / {formatTime(duration)}</Text>
                                </View>
                            </View>

                            <View style={styles.controlsRight}>
                                <Ionicons name="play-skip-forward" size={20} color="#FFF" />
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        marginHorizontal: 20,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    bgImage: {
        flex: 1,
        borderRadius: 24,
    },
    gradient: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    label: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        fontWeight: '500',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        gap: 3,
    },
    waveBar: {
        width: 3,
        backgroundColor: '#FFF',
        borderRadius: 1.5,
    },
    timeLabels: {
        position: 'absolute',
        right: 0,
        bottom: -16,
    },
    timeText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '600',
    },
    controlsRight: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
    },
});
