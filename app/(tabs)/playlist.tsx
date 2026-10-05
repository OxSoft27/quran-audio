import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Modal,
    FlatList,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import Animated from 'react-native-reanimated';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useDownload, DownloadedItem } from '@/context/DownloadContext';
import { QARIS, Qari, getAudioUrl, fetchSurahs, Surah } from '@/services/quranApi';
import { QariAvatar } from '@/components/QariAvatar';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.pagePadding * 2 - 12) / 2;

export interface ThemedPlaylist {
    id: string;
    title: string;
    description: string;
    icon: any;
    colors: [string, string];
    accentColor: string;
    surahNumbers: number[];
}

export const THEMED_PLAYLISTS: ThemedPlaylist[] = [
    {
        id: 'favorit',
        title: 'Favorit',
        description: 'Surah yang Anda sukai',
        icon: 'star',
        colors: ['#231B0E', '#100D06'],
        accentColor: '#F59E0B',
        surahNumbers: [1, 18, 36, 55, 56, 67],
    },
    {
        id: 'fokus_kerja',
        title: 'Fokus & Kerja',
        description: 'Menemani bekerja & belajar',
        icon: 'radio-outline',
        colors: ['#0A2A3C', '#041520'],
        accentColor: '#06B6D4',
        surahNumbers: [55, 56, 67, 36, 18],
    },
    {
        id: 'bacaan_terindah',
        title: 'Bacaan Terindah',
        description: 'Maqaam merdu penyejuk hati',
        icon: 'musical-notes-outline',
        colors: ['#420D2D', '#1D0413'],
        accentColor: '#EC4899',
        surahNumbers: [19, 12, 14, 20, 76],
    },
    {
        id: 'mode_tidur',
        title: 'Mode Tidur',
        description: 'Menenangkan sebelum tidur',
        icon: 'moon-outline',
        colors: ['#121838', '#070A18'],
        accentColor: '#6366F1',
        surahNumbers: [32, 67, 76, 85, 78, 112, 113, 114],
    },
    {
        id: 'doa_ruqyah',
        title: 'Doa & Ruqyah',
        description: 'Ayat syifa & perlindungan',
        icon: 'shield-checkmark-outline',
        colors: ['#0D2F24', '#041711'],
        accentColor: '#10B981',
        surahNumbers: [1, 2, 37, 112, 113, 114],
    },
    {
        id: 'penghayatan',
        title: 'Lantunan Penuh Penghayatan',
        description: 'Tadabbur mendalam',
        icon: 'heart-outline',
        colors: ['#280E54', '#100424'],
        accentColor: '#8B5CF6',
        surahNumbers: [50, 53, 75, 69, 89],
    },
];

export default function PlaylistScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { playSurah, currentTrack } = useAudio();
    const { favorites } = useFavorites();
    const { scrollHandler } = useTabBarAnimation();
    const { downloadedList, formattedStorageUsed, deleteDownloadedSurah } = useDownload();

    const [selectedPlaylist, setSelectedPlaylist] = useState<ThemedPlaylist | null>(null);
    const [selectedQari, setSelectedQari] = useState<Qari>(QARIS[0]);
    const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
    const [showDownloadsModal, setShowDownloadsModal] = useState(false);

    React.useEffect(() => {
        loadSurahs();
    }, []);

    const loadSurahs = async () => {
        const data = await fetchSurahs();
        setAllSurahs(data);
    };

    const handleOpenPlaylist = (playlist: ThemedPlaylist) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlaylist(playlist);
    };

    const handlePlaySurahInPlaylist = (surahNumber: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const surah = allSurahs.find((s) => s.number === surahNumber);
        if (!surah) return;
        const url = getAudioUrl(selectedQari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: selectedQari.name,
            surahNumber: surah.number,
            qariId: selectedQari.id,
        });
    };

    const handlePlayAll = () => {
        if (!selectedPlaylist || selectedPlaylist.surahNumbers.length === 0) return;
        handlePlaySurahInPlaylist(selectedPlaylist.surahNumbers[0]);
    };

    const handlePlayDownloaded = (item: DownloadedItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playSurah(item.fileUri, {
            surahName: item.surahName,
            qariName: item.qariName,
            surahNumber: item.surahNumber,
            qariId: item.qariId,
        });
    };

    const handlePlayAllDownloaded = () => {
        if (downloadedList.length === 0) return;
        handlePlayDownloaded(downloadedList[0]);
    };

    const handleDeleteDownloaded = (item: DownloadedItem) => {
        Alert.alert(
            'Hapus Unduhan',
            `Hapus file offline untuk Surah ${item.surahName} (${item.qariName})?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteDownloadedSurah(item.qariId, item.surahNumber);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F4F4F5' }]}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {t('playlist.title', 'Daftar Putar')}
                    </Text>
                </View>

                {/* Offline Downloads Banner Card */}
                <View style={styles.offlineCardContainer}>
                    <TouchableOpacity
                        style={styles.offlineCard}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowDownloadsModal(true);
                        }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#064e3b', '#022c22']}
                            style={styles.offlineCardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.offlineCardLeft}>
                                <View style={styles.offlineIconWrapper}>
                                    <Ionicons name="cloud-done" size={24} color="#10B981" />
                                </View>
                                <View style={styles.offlineCardTexts}>
                                    <View style={styles.offlineTitleRow}>
                                        <Text style={styles.offlineCardTitle}>Unduhan Saya (Offline)</Text>
                                        <View style={styles.offlineBadge}>
                                            <Text style={styles.offlineBadgeText}>
                                                {downloadedList.length} Surah
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.offlineCardSubtitle} numberOfLines={1}>
                                        {downloadedList.length > 0
                                            ? `Total ${formattedStorageUsed} • Siap diputar tanpa kuota`
                                            : 'Belum ada surah diunduh • Bebas kuota'}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* 2-Column Grid of 6 Glowing Cards */}
                <View style={styles.grid}>
                    {THEMED_PLAYLISTS.map((playlist) => {
                        const count =
                            playlist.id === 'favorit' && favorites.length > 0
                                ? favorites.length
                                : playlist.surahNumbers.length;

                        return (
                            <TouchableOpacity
                                key={playlist.id}
                                style={styles.card}
                                onPress={() => handleOpenPlaylist(playlist)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={playlist.colors}
                                    style={styles.cardGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.cardTopRow}>
                                        <View
                                            style={[
                                                styles.iconWrapper,
                                                { backgroundColor: `${playlist.accentColor}25` },
                                            ]}
                                        >
                                            <Ionicons
                                                name={playlist.icon}
                                                size={28}
                                                color={playlist.accentColor}
                                            />
                                        </View>
                                        <Text style={styles.cardCount}>{count} surah</Text>
                                    </View>

                                    <View style={styles.cardBottom}>
                                        <Text style={styles.cardTitle} numberOfLines={2}>
                                            {playlist.title}
                                        </Text>
                                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                                            {playlist.description}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Koleksi oleh Qari Section */}
                <View style={styles.qariSection}>
                    <Text style={[styles.sectionHeader, { color: isDark ? '#FFFFFF' : '#111827' }]}>Koleksi oleh Qari</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.qariList}
                    >
                        {QARIS.slice(0, 10).map((qari) => (
                            <QariAvatar
                                key={qari.id}
                                qari={qari}
                                onPress={(q) => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedQari(q);
                                    // Open favorite playlist with this Qari
                                    setSelectedPlaylist(THEMED_PLAYLISTS[0]);
                                }}
                            />
                        ))}
                    </ScrollView>
                </View>

                <View style={{ height: 230 }} />
            </Animated.ScrollView>

            {/* Playlist Detail Modal Sheet */}
            {selectedPlaylist && (
                <Modal
                    visible={true}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setSelectedPlaylist(null)}
                >
                    <View style={styles.modalContainer}>
                        <LinearGradient
                            colors={[selectedPlaylist.colors[0], '#09090B']}
                            style={StyleSheet.absoluteFill}
                        />
                        <SafeAreaView style={styles.modalSafeArea}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setSelectedPlaylist(null)}
                                >
                                    <Ionicons name="close" size={22} color="#FFFFFF" />
                                </TouchableOpacity>
                                <View style={styles.modalHeaderTitleWrap}>
                                    <Text style={styles.modalHeaderTitle}>{selectedPlaylist.title}</Text>
                                    <Text style={styles.modalHeaderSub}>{selectedPlaylist.description}</Text>
                                </View>
                            </View>

                            {/* Play All CTA */}
                            <View style={styles.playAllWrap}>
                                <TouchableOpacity
                                    style={[styles.playAllBtn, { backgroundColor: selectedPlaylist.accentColor }]}
                                    onPress={handlePlayAll}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="play" size={20} color="#000000" style={{ marginRight: 8 }} />
                                    <Text style={styles.playAllBtnText}>Putar Semua</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Surah List in Playlist */}
                            <FlatList
                                data={allSurahs.filter((s) =>
                                    selectedPlaylist.surahNumbers.includes(s.number)
                                )}
                                keyExtractor={(item) => item.number.toString()}
                                contentContainerStyle={styles.modalList}
                                renderItem={({ item, index }) => {
                                    const isPlayingThis =
                                        currentTrack?.surahNumber === item.number;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.playlistSurahItem,
                                                isPlayingThis && styles.playlistSurahActive,
                                            ]}
                                            onPress={() => handlePlaySurahInPlaylist(item.number)}
                                        >
                                            <Text style={styles.playlistSurahIndex}>{index + 1}</Text>
                                            <View style={styles.playlistSurahInfo}>
                                                <Text style={styles.playlistSurahName}>
                                                    {item.englishName}
                                                </Text>
                                                <Text style={styles.playlistSurahMeta}>
                                                    {item.englishNameTranslation} • {item.numberOfAyahs} Ayat
                                                </Text>
                                            </View>
                                            <Text style={styles.playlistArabicName}>{item.name}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </SafeAreaView>
                    </View>
                </Modal>
            )}

            {/* Offline Downloads Modal Sheet */}
            <Modal
                visible={showDownloadsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDownloadsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['#064e3b', '#09090B']}
                        style={StyleSheet.absoluteFill}
                    />
                    <SafeAreaView style={styles.modalSafeArea}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowDownloadsModal(false)}
                            >
                                <Ionicons name="close" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <View style={styles.modalHeaderTitleWrap}>
                                <Text style={styles.modalHeaderTitle}>Unduhan Saya</Text>
                                <Text style={styles.modalHeaderSub}>
                                    {downloadedList.length} Surah tersimpan ({formattedStorageUsed})
                                </Text>
                            </View>
                        </View>

                        {downloadedList.length > 0 ? (
                            <>
                                {/* Play All CTA */}
                                <View style={styles.playAllWrap}>
                                    <TouchableOpacity
                                        style={[styles.playAllBtn, { backgroundColor: '#10B981' }]}
                                        onPress={handlePlayAllDownloaded}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="play" size={20} color="#000000" style={{ marginRight: 8 }} />
                                        <Text style={styles.playAllBtnText}>Putar Semua Offline</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Downloaded Surahs List */}
                                <FlatList
                                    data={downloadedList}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.modalList}
                                    renderItem={({ item, index }) => {
                                        const isPlayingThis =
                                            currentTrack?.surahNumber === item.surahNumber &&
                                            currentTrack?.qariId === item.qariId;
                                        const sizeMb = (item.fileSize / (1024 * 1024)).toFixed(1);

                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.playlistSurahItem,
                                                    isPlayingThis && styles.playlistSurahActive,
                                                ]}
                                                onPress={() => handlePlayDownloaded(item)}
                                                activeOpacity={0.75}
                                            >
                                                <Text style={styles.playlistSurahIndex}>{index + 1}</Text>
                                                <View style={styles.playlistSurahInfo}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={styles.playlistSurahName}>
                                                            {item.surahName}
                                                        </Text>
                                                        <View style={styles.offlineMiniPill}>
                                                            <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                                                            <Text style={styles.offlineMiniPillText}>{sizeMb} MB</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.playlistSurahMeta}>
                                                        Qari: {item.qariName}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteDownloaded(item)}
                                                    style={styles.deleteDownloadBtn}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Ionicons name="trash-outline" size={19} color="#F87171" />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </>
                        ) : (
                            <View style={styles.emptyOfflineContainer}>
                                <Ionicons name="cloud-offline-outline" size={54} color="rgba(255, 255, 255, 0.3)" />
                                <Text style={styles.emptyOfflineTitle}>Belum Ada Surah Terunduh</Text>
                                <Text style={styles.emptyOfflineSub}>
                                    Buka profil Qari favorit Anda di tab Beranda, lalu ketuk ikon unduh pada surah yang diinginkan untuk mendengarkan tanpa kuota internet.
                                </Text>
                            </View>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.xl,
    },
    header: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.size.largeTitle,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        color: '#FFFFFF',
        letterSpacing: Typography.tracking.tight,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.pagePadding,
        gap: 12,
        marginBottom: Spacing['2xl'],
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.15,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    cardGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardCount: {
        fontSize: Typography.size.caption2,
        color: 'rgba(255, 255, 255, 0.65)',
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    cardBottom: {
        marginTop: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        letterSpacing: Typography.tracking.subhead,
        color: '#FFFFFF',
        lineHeight: 22,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    qariSection: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.md,
    },
    qariList: {
        paddingHorizontal: Spacing.pagePadding,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    modalSafeArea: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Platform.OS === 'ios' ? 12 : 20,
        paddingBottom: 16,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalHeaderTitleWrap: {
        flex: 1,
    },
    modalHeaderTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalHeaderSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        marginTop: 2,
    },
    playAllWrap: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: 16,
    },
    playAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 20,
    },
    playAllBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
    },
    modalList: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 40,
    },
    playlistSurahItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    playlistSurahActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    playlistSurahIndex: {
        width: 28,
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.4)',
    },
    playlistSurahInfo: {
        flex: 1,
    },
    playlistSurahName: {
        fontSize: 16,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
        color: '#FFFFFF',
    },
    playlistSurahMeta: {
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 2,
    },
    playlistArabicName: {
        fontSize: 20,
        color: '#FFFFFF',
        fontFamily: Typography.fontFamily.quran,
        lineHeight: 30,
    },
    offlineCardContainer: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.lg,
    },
    offlineCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    offlineCardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    offlineCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    offlineIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    offlineCardTexts: {
        flex: 1,
    },
    offlineTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 3,
    },
    offlineCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    offlineBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    offlineBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '700',
    },
    offlineCardSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.65)',
    },
    emptyOfflineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        gap: 12,
    },
    emptyOfflineTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 8,
    },
    emptyOfflineSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        lineHeight: 20,
    },
    offlineMiniPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        gap: 3,
    },
    offlineMiniPillText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },
    deleteDownloadBtn: {
        padding: 8,
        marginLeft: 8,
    },
});
