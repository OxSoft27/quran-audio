import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { Qari } from '@/services/quranApi';

interface QariAvatarProps {
    qari: Qari;
    isSelected?: boolean;
    badge?: string;
    onPress: (qari: Qari) => void;
}

const QARI_IMAGES: Record<string, any> = {
    'mishary': require('@/assets/images/qaris/mishary.png'),
    'abdulbasit': require('@/assets/images/qaris/abdulbasit.png'),
    'saad': require('@/assets/images/qaris/saad.png'),
    'maher': require('@/assets/images/qaris/maher.png'),
};

export const QariAvatar: React.FC<QariAvatarProps> = ({ qari, isSelected, badge, onPress }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const imageSource = qari.image || QARI_IMAGES[qari.id];

    return (
        <TouchableOpacity onPress={() => onPress(qari)} style={styles.container} activeOpacity={0.75}>
            <View style={styles.avatarWrapper}>
                <View style={[
                    styles.avatarContainer,
                    {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        backgroundColor: isDark ? '#1E1E1E' : '#E5E7EB',
                        shadowOpacity: isDark ? 0.15 : 0.08,
                    },
                    isSelected && { borderColor: Colors[theme].tint, borderWidth: 2.5 }
                ]}>
                    {qari.initials ? (
                        <View style={[styles.initialsContainer, { backgroundColor: qari.initials === 'MS' ? '#A06B42' : '#2D5B45' }]}>
                            <Text style={styles.initialsText}>{qari.initials}</Text>
                        </View>
                    ) : (
                        <Image
                            source={imageSource || QARI_IMAGES['mishary']}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    )}
                </View>
                {badge && (
                    <View style={[
                        styles.badgeContainer,
                        { borderColor: isDark ? '#0F1C1B' : '#FFFFFF' }
                    ]}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.name, { color: Colors[theme].text }]} numberOfLines={2}>
                {qari.name}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 84,
        marginRight: Spacing.md,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: Spacing.sm,
    },
    avatarContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        backgroundColor: 'transparent',
    },
    image: {
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    initialsContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 1,
    },
    badgeContainer: {
        position: 'absolute',
        top: 0,
        right: -2,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#0F1C1B',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: Typography.size.caption1,
        textAlign: 'center',
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.text,
        lineHeight: 16,
    },
});
