import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { SurahListItem } from '@/components/SurahListItem';
import { fetchSurahs, getAudioUrl, QARIS, Surah } from '@/services/quranApi';

export default function ForYouScreen() {
    const { theme } = useTheme();
    const { playSurah, currentTrack } = useAudio();
    const [dailySurahs, setDailySurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkDailySurahs();
    }, []);

    const checkDailySurahs = async () => {
        setLoading(true);
        try {
            const today = new Date().toDateString();
            const lastUpdate = await AsyncStorage.getItem('@daily_update_date');
            const savedSurahs = await AsyncStorage.getItem('@daily_surahs');

            if (lastUpdate === today && savedSurahs) {
                setDailySurahs(JSON.parse(savedSurahs));
            } else {
                await generateNewDailySurahs(today);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const generateNewDailySurahs = async (dateStr: string) => {
        const allSurahs = await fetchSurahs();
        if (allSurahs.length > 0) {
            // Pick 5 random
            const shuffled = [...allSurahs].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5);

            setDailySurahs(selected);
            await AsyncStorage.setItem('@daily_update_date', dateStr);
            await AsyncStorage.setItem('@daily_surahs', JSON.stringify(selected));
        }
    };

    const handlePlay = (surah: Surah) => {
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
                <Text style={[styles.title, { color: Colors[theme].text }]}>Untukmu</Text>
                <Text style={[styles.subtitle, { color: Colors[theme].subtitle }]}>
                    Rekomendasi harian
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors[theme].tint} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={dailySurahs}
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
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    listContent: {
        paddingBottom: 100,
    },
});
