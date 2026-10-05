import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { Qari } from '@/services/quranApi';

interface FavoriteQariHeroProps {
    qari: Qari;
    onPressPlay: () => void;
    isPlaying?: boolean;
}

const QARI_IMAGES: Record<string, any> = {
    'mishary': require('@/assets/images/qaris/mishary.png'),
    'abdulbasit': require('@/assets/images/qaris/abdulbasit.png'),
    'saad': require('@/assets/images/qaris/saad.png'),
    'maher': require('@/assets/images/qaris/maher.png'),
};

export const FavoriteQariHero: React.FC<FavoriteQariHeroProps> = ({
    qari,
    onPressPlay,
    isPlaying = false,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const imageSource = qari.image || QARI_IMAGES[qari.id] || QARI_IMAGES['mishary'];

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }
        ]}>
            {/* Large Circular Avatar */}
            <View style={styles.avatarWrapper}>
                <Image
                    source={imageSource}
                    style={styles.avatar}
                    resizeMode="cover"
                />
            </View>

            {/* Info and Action */}
            <View style={styles.content}>
                <Text style={[styles.subtitle, { color: Colors[theme].subtitle }]}>
                    Dari favorit Anda
                </Text>
                <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={1}>
                    {qari.name}
                </Text>

                <TouchableOpacity
                    onPress={onPressPlay}
                    style={[
                        styles.playButton,
                        {
                            backgroundColor: isDark ? '#FFFFFF' : '#0F1C1B',
                        }
                    ]}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color={isDark ? '#000000' : '#FFFFFF'}
                        style={styles.playIcon}
                    />
                    <Text style={[
                        styles.playButtonText,
                        { color: isDark ? '#000000' : '#FFFFFF' }
                    ]}>
                        {isPlaying ? "Jeda" : "Lanjut dengar"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.pagePadding,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Spacing.xl,
        borderWidth: 1,
    },
    avatarWrapper: {
        width: 86,
        height: 86,
        borderRadius: 43,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: '#1E1E1E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        marginLeft: Spacing.lg,
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.medium,
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: Typography.size.headline,
        fontWeight: Typography.weight.bold,
        marginBottom: Spacing.md,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    playIcon: {
        marginRight: Spacing.xs + 2,
    },
    playButtonText: {
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.bold,
    },
});
