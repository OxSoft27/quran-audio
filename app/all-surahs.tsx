import { SurahListItem } from '@/components/SurahListItem';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchSurahs, getAudioUrl, QARIS, Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';

import { MiniPlayer } from '@/components/MiniPlayer';
import * as Haptics from 'expo-haptics';

export default function AllSurahsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { playSurah, currentTrack, isPlaying } = useAudio();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Respect the currently playing or active Qari, fallback to first Qari
    const selectedQari = (currentTrack && QARIS.find(q => q.id === currentTrack.qariId)) || QARIS[0];

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const url = getAudioUrl(selectedQari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: selectedQari.name,
            surahNumber: surah.number,
            qariId: selectedQari.id,
        });
        // Immediately present the player modal so the user doesn't have to navigate back to Home
        router.push('/player/fullscreen');
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
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[
                            styles.backButton,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={Colors[theme].tint}
                            style={{ marginRight: 1.5 }}
                        />
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
                <ActivityIndicator size="large" color={Colors[theme].tint} style={{ marginTop: Spacing['5xl'] }} />
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

            {/* Persistent MiniPlayer when audio is playing */}
            <MiniPlayer hasTabBar={false} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    searchContainer: {
        padding: Spacing.pagePadding,
        paddingBottom: Spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        height: Spacing['4xl'],
        borderRadius: Spacing.md,
    },
    input: {
        flex: 1,
        marginLeft: Spacing.sm + 2,
        fontSize: Typography.size.body,
    },
    listContent: {
        paddingBottom: Spacing['8xl'] + 32, // Space for mini player
    },
});
