import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, AppState, AppStateStatus } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface FullscreenVideoBackgroundProps {
    videoSource?: string | any;
    isPlaying: boolean;
    posterSource?: string | any;
    children?: React.ReactNode;
}

export const FullscreenVideoBackground: React.FC<FullscreenVideoBackgroundProps> = ({
    videoSource,
    isPlaying,
    posterSource,
    children,
}) => {
    const source = videoSource || null;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Initialize expo-video player with muted=true, loop=true, and explicitly disable background/now playing
    const player = useVideoPlayer(source, (p) => {
        if (!p) return;
        p.loop = true;
        p.muted = true; // Video must be muted to not clash with QuranFlow audio
        p.showNowPlayingNotification = false;
        p.staysActiveInBackground = false;
    });

    // Synchronize video playback with the QuranFlow audio state and AppState
    useEffect(() => {
        if (!player) return;
        try {
            if (isPlaying && appStateRef.current === 'active') {
                player.play();
            } else {
                player.pause();
            }
        } catch (error) {
            console.warn('[FullscreenVideoBackground] Error controlling video playback:', error);
        }
    }, [isPlaying, player]);

    // Handle AppState changes (pause video when backgrounded to prevent GPU/decoder clash)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            appStateRef.current = nextState;
            if (!player) return;
            try {
                if (nextState === 'active' && isPlaying) {
                    player.play();
                } else {
                    player.pause();
                }
            } catch (_) { }
        });
        return () => subscription.remove();
    }, [isPlaying, player]);

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Fallback / Instant Poster Image (Mountains & Clouds matching reference) */}
            {posterSource && (
                <Image
                    source={typeof posterSource === 'string' ? { uri: posterSource } : posterSource}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            )}

            {/* Video Background Layer (Pure video without vignette or black gradient) */}
            {source && player && (
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    nativeControls={false}
                />
            )}

            {children}
        </View>
    );
};
