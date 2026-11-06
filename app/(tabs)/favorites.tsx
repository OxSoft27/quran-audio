import React from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';
import { SurahListItem } from '@/components/SurahListItem';
import { getAudioUrl, QARIS, Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function FavoritesScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { playSurah, currentTrack } = useAudio();
    const { favorites } = useFavorites();

    const handlePlay = (surah: Surah) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const qari = QARIS[0];
        const url = getAudioUrl(qari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: qari.name,
            surahNumber: surah.number,
            qariId: qari.id,
        });
    };

    const handlePlayAll = () => {
        if (favorites.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handlePlay(favorites[0]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : Colors.light.background }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {router.canGoBack() && (
                        <TouchableOpacity
                            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTextWrap}>
                        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : Colors.light.text }]}>
                            Favorit
                        </Text>
                        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {favorites.length} Surah tersimpan
                        </Text>
                    </View>
                </View>

                {favorites.length > 0 && (
                    <TouchableOpacity
                        style={styles.playAllBtn}
                        onPress={handlePlayAll}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="play" size={16} color="#000000" style={{ marginRight: 6 }} />
                        <Text style={styles.playAllBtnText}>Putar Semua</Text>
                    </TouchableOpacity>
                )}
            </View>

            {favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.08)' }]}>
                        <Ionicons name="heart-outline" size={48} color="#F43F5E" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Belum ada surah favorit
                    </Text>
                    <Text style={[styles.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Ketuk ikon hati pada surah saat mendengarkan untuk menyimpannya di sini
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
                    showsVerticalScrollIndicator={false}
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
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        gap: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    playAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    playAllBtnText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 220,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        paddingBottom: 100,
        gap: 10,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySub: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});
