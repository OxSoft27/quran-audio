import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { useRouter } from 'expo-router';

export const MiniPlayer = () => {
    const { theme } = useTheme();
    const { currentTrack, isPlaying, togglePlayPause, position, duration } = useAudio();
    const router = useRouter();

    if (!currentTrack) return null;

    const progress = duration > 0 ? position / duration : 0;

    const handlePress = () => {
        router.push('/player/fullscreen');
    };

    const Container = Platform.OS === 'ios' ? BlurView : View;
    const containerProps = Platform.OS === 'ios'
        ? { intensity: 80, tint: theme, style: styles.container }
        : { style: [styles.container, { backgroundColor: Colors[theme].card }] };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.wrapper}>
            {/* @ts-ignore */}
            <Container {...containerProps}>
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors[theme].background }]}>
                        <Ionicons name="musical-note" size={20} color={Colors[theme].tint} />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={1}>
                            {currentTrack.surahName}
                        </Text>
                        <Text style={[styles.subtitle, { color: Colors[theme].subtitle }]} numberOfLines={1}>
                            {currentTrack.qariName}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayPause(); }} style={styles.playButton}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors[theme].text} />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: Colors[theme].tint }]} />
                </View>
            </Container>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 84, // Above tab bar
        left: 10,
        right: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    container: {
        padding: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
    },
    playButton: {
        padding: 8,
    },
    progressBar: {
        height: 3,
        backgroundColor: 'rgba(128,128,128,0.2)',
        borderRadius: 1.5,
        width: '100%',
    },
    progressFill: {
        height: '100%',
        borderRadius: 1.5,
    },
});
