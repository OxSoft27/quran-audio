import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { SurahListItem } from '@/components/SurahListItem';
import { getAudioUrl, QARIS, Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
    const { theme } = useTheme();
    const { playSurah, currentTrack } = useAudio();
    const [favorites, setFavorites] = useState<Surah[]>([]);

    // Reload favorites when tab is focused
    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@favorites');
            if (jsonValue != null) {
                setFavorites(JSON.parse(jsonValue));
            } else {
                setFavorites([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePlay = (surah: Surah) => {
        // Default Qari
        const qari = QARIS[0];
        const url = getAudioUrl(qari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: qari.name,
            surahNumber: surah.number,
            qariId: qari.id,
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors[theme].text }]}>Favorit</Text>
            </View>

            {favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={80} color={Colors[theme].subtitle} />
                    <Text style={[styles.emptyText, { color: Colors[theme].subtitle }]}>
                        Belum ada surah favorit
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.number.toString()}
                    renderItem={({ item }) => (
                        <SurahListItem
                            surah={item}
                            isPlaying={currentTrack?.surahNumber === item.number}
                            onPress={() => handlePlay(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.pagePadding,
    },
    title: {
        ...Typography.preset.title1,
    },
    listContent: {
        paddingBottom: Spacing['8xl'],
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Spacing['8xl'],
    },
    emptyText: {
        marginTop: Spacing.lg,
        fontSize: Typography.size.body,
    },
});
