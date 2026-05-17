import { SurahListItem } from '@/components/SurahListItem';
import { Colors } from '@/constants/Colors';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchSurahs, getAudioUrl, QARIS, Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';

export default function AllSurahsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { playSurah, currentTrack, isPlaying } = useAudio();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Default Qari for the list - in a real app this might be global state
    const selectedQari = QARIS[0];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredSurahs(surahs);
        } else {
            const lower = search.toLowerCase();
            setFilteredSurahs(surahs.filter(s =>
                s.englishName.toLowerCase().includes(lower) ||
                s.name.includes(search) ||
                s.number.toString().includes(search)
            ));
        }
    }, [search, surahs]);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchSurahs();
        setSurahs(data);
        setFilteredSurahs(data);
        setLoading(false);
    };

    const handlePlay = (surah: Surah) => {
        const url = getAudioUrl(selectedQari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: selectedQari.name,
            surahNumber: surah.number,
            qariId: selectedQari.id,
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Stack.Screen options={{
                title: 'Semua Surah',
                headerShown: true,
                headerStyle: { backgroundColor: Colors[theme].background },
                headerTitleStyle: { color: Colors[theme].text },
                headerTintColor: Colors[theme].tint,
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8, paddingRight: 10 }}>
                        <Ionicons name="chevron-back" size={28} color={Colors[theme].tint} />
                    </TouchableOpacity>
                ),
            }} />

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: Colors[theme].card }]}>
                    <Ionicons name="search" size={20} color={Colors[theme].subtitle} />
                    <TextInput
                        style={[styles.input, { color: Colors[theme].text }]}
                        placeholder="Cari Surah..."
                        placeholderTextColor={Colors[theme].subtitle}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <Ionicons name="close-circle" size={20} color={Colors[theme].subtitle} onPress={() => setSearch('')} />
                    )}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors[theme].tint} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredSurahs}
                    keyExtractor={(item) => item.number.toString()}
                    renderItem={({ item }) => (
                        <SurahListItem
                            surah={item}
                            isPlaying={currentTrack?.surahNumber === item.number}
                            isFavorite={isFavorite(item.number)}
                            onPress={() => handlePlay(item)}
                            onToggleFavorite={() => toggleFavorite(item)}
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
    searchContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 100, // Space for mini player
    },
});
