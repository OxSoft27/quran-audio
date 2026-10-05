import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SurahListItemProps {
    surah: Surah;
    isPlaying?: boolean;
    isFavorite?: boolean;
    onPress: () => void;
    onToggleFavorite?: () => void;
}

export const SurahListItem: React.FC<SurahListItemProps> = ({ surah, isPlaying, isFavorite, onPress, onToggleFavorite }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: Colors[theme].card }]}
            onPress={onPress}
        >
            <View style={[styles.numberContainer, { backgroundColor: Colors[theme].background }]}>
                <Text style={[styles.number, { color: Colors[theme].tint }]}>{surah.number}</Text>
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.name, { color: Colors[theme].text }]}>{surah.englishName}</Text>
                <Text style={[styles.details, { color: Colors[theme].subtitle }]}>
                    {surah.revelationType} • {surah.numberOfAyahs} Ayahs
                </Text>
            </View>

            <View style={styles.arabicContainer}>
                <Text style={[styles.arabicName, { color: Colors[theme].primary }]}>{surah.name}</Text>
                {onToggleFavorite && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        style={{ padding: Spacing.xs, marginTop: Spacing.xs }}
                    >
                        <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={20}
                            color={isFavorite ? Colors[theme].tint : Colors[theme].subtitle}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {isPlaying && (
                <Ionicons name="stats-chart" size={16} color={Colors[theme].tint} style={{ marginLeft: Spacing.sm + Spacing.xs }} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        marginHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.md,
        borderRadius: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    numberContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    number: {
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.body,
        marginBottom: Spacing.xs,
    },
    details: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: 0,
    },
    arabicContainer: {
        alignItems: 'flex-end',
    },
    arabicName: {
        fontSize: 22,
        fontFamily: Typography.fontFamily.quran,
        lineHeight: 32,
    },
});
