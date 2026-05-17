import { Colors } from '@/constants/Colors';
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
                        style={{ padding: 4, marginTop: 4 }}
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
                <Ionicons name="stats-chart" size={16} color={Colors[theme].tint} style={{ marginLeft: 10 }} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
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
        marginRight: 16,
    },
    number: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    details: {
        fontSize: 12,
    },
    arabicContainer: {
        alignItems: 'flex-end',
    },
    arabicName: {
        fontSize: 20,
        fontFamily: 'System',
        // In a real app, use a proper Arabic font like Amiri or Scheherazade
    },
});
