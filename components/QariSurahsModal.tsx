import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { SurahItem } from '@/constants/surahsData';
import { useAudio } from '@/context/AudioContext';
import { useDownload } from '@/context/DownloadContext';
import { Qari, getAudioUrl, getQariSurahs } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface QariSurahsModalProps {
    visible: boolean;
    qari: Qari | null;
    onClose: () => void;
}

export const QariSurahsModal: React.FC<QariSurahsModalProps> = ({
    visible,
    qari,
    onClose,
}) => {
    const { currentTrack, isPlaying, playSurah } = useAudio();
    const {
        isSurahDownloaded,
        isSurahDownloading,
        getDownloadProgress,
        downloadSurah,
        deleteDownloadedSurah,
        downloadAllSurahsForQari,
        cancelBatchDownload,
        isBatchDownloading,
        batchProgress,
    } = useDownload();
    const [searchQuery, setSearchQuery] = useState('');

    const surahs = useMemo(() => {
        if (!qari) return [];
        return getQariSurahs(qari);
    }, [qari]);

    const filteredSurahs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return surahs;
        return surahs.filter(
            (s) =>
                s.number.toString().includes(query) ||
                s.englishName.toLowerCase().includes(query) ||
                s.indonesianName.toLowerCase().includes(query) ||
                s.meaning.toLowerCase().includes(query) ||
                s.name.includes(query)
        );
    }, [surahs, searchQuery]);

    const allDownloaded = useMemo(() => {
        if (!qari || surahs.length === 0) return false;
        return surahs.every((s) => isSurahDownloaded(qari.id, s.number));
    }, [qari, surahs, isSurahDownloaded]);

    if (!qari) return null;

    const isFullQuran = !qari.availableSurahs || qari.availableSurahs.length === 114;
    const surahCountText = isFullQuran
        ? '114 Surah (Lengkap)'
        : `${surahs.length} Surah Tersedia`;

    const handlePlaySurah = (item: SurahItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const url = getAudioUrl(qari.id, item.number);
        playSurah(url, {
            surahName: item.englishName,
            qariName: qari.name,
            surahNumber: item.number,
            qariId: qari.id,
        });
    };

    const handleToggleDownload = async (item: SurahItem) => {
        if (isSurahDownloading(qari.id, item.number)) {
            return;
        }
        if (isSurahDownloaded(qari.id, item.number)) {
            Alert.alert(
                'Hapus Unduhan',
                `Hapus file audio offline untuk Surah ${item.englishName} (${qari.name})?`,
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteDownloadedSurah(qari.id, item.number);
                        },
                    },
                ]
            );
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await downloadSurah(qari, item);
        }
    };

    const handleBatchDownload = () => {
        if (allDownloaded) {
            Alert.alert('Sudah Terunduh', `Semua surah untuk ${qari.name} sudah tersedia secara offline.`);
            return;
        }
        Alert.alert(
            'Unduh Semua Surah',
            `Apakah Anda ingin mengunduh semua surah (${surahs.length} surah) untuk ${qari.name} agar bisa didengarkan tanpa kuota/internet?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Unduh Semua',
                    onPress: () => {
                        downloadAllSurahsForQari(qari, surahs);
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <BlurView intensity={85} tint="dark" style={styles.sheetContainer}>
                    {/* Top Drag Handle */}
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Qari Header Card */}
                    <View style={styles.qariHeader}>
                        <View style={styles.avatarContainer}>
                            {qari.image ? (
                                <Image source={qari.image} style={styles.avatar} resizeMode="cover" />
                            ) : (
                                <View style={styles.initialsAvatar}>
                                    <Text style={styles.initialsText}>{qari.initials || qari.name.slice(0, 2).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.qariDetails}>
                            <Text style={styles.qariName} numberOfLines={1}>
                                {qari.name}
                            </Text>
                            <View style={styles.badgeRow}>
                                {qari.country && (
                                    <View style={styles.countryBadge}>
                                        <Text style={styles.badgeText}>{qari.country}</Text>
                                    </View>
                                )}
                                <View style={[styles.surahCountBadge, isFullQuran && styles.fullQuranBadge]}>
                                    <Text style={[styles.badgeText, isFullQuran && styles.fullQuranText]}>
                                        {surahCountText}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.batchDownloadBtn, allDownloaded && styles.batchDownloadBtnDone]}
                                    onPress={handleBatchDownload}
                                    disabled={isBatchDownloading}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={allDownloaded ? "checkmark-circle" : "cloud-download-outline"}
                                        size={13}
                                        color={allDownloaded ? "#10B981" : "#38BDF8"}
                                    />
                                    <Text style={[styles.batchDownloadText, allDownloaded && styles.batchDownloadTextDone]}>
                                        {allDownloaded ? "Offline Ready" : "Unduh Semua"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={50} tint="dark" style={styles.closeBlur}>
                                <Ionicons name="close" size={20} color="#FFFFFF" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    {/* Batch Download Progress Banner */}
                    {isBatchDownloading && batchProgress?.qariId === qari.id && (
                        <View style={styles.batchProgressContainer}>
                            <View style={styles.batchProgressTop}>
                                <View style={styles.batchProgressLeft}>
                                    <ActivityIndicator size="small" color="#10B981" style={{ marginRight: 8 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.batchProgressTitle} numberOfLines={1}>
                                            Mengunduh Surah {batchProgress.current}/{batchProgress.total}
                                        </Text>
                                        <Text style={styles.batchProgressSubtitle} numberOfLines={1}>
                                            {batchProgress.currentSurahName}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={cancelBatchDownload} style={styles.cancelBatchBtn}>
                                    <Text style={styles.cancelBatchText}>Batal</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.batchProgressTrack}>
                                <View
                                    style={[
                                        styles.batchProgressFill,
                                        {
                                            width: `${Math.min(100, Math.max(5, Math.round((batchProgress.current / batchProgress.total) * 100)))}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons
                            name="search"
                            size={18}
                            color="rgba(255, 255, 255, 0.45)"
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari surah (misal: Al-Kahf, Yasin)..."
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            clearButtonMode="while-editing"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.5)" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Surahs List */}
                    <FlatList
                        data={filteredSurahs}
                        keyExtractor={(item) => item.number.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
                                <Text style={styles.emptyText}>Surah tidak ditemukan untuk qari ini</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const isCurrentTrack =
                                currentTrack?.surahNumber === item.number &&
                                currentTrack?.qariId === qari.id;
                            const downloaded = isSurahDownloaded(qari.id, item.number);
                            const downloading = isSurahDownloading(qari.id, item.number);
                            const progress = getDownloadProgress(qari.id, item.number);

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.surahItem,
                                        isCurrentTrack && styles.surahItemActive,
                                    ]}
                                    onPress={() => handlePlaySurah(item)}
                                    activeOpacity={0.75}
                                >
                                    {/* Number Badge */}
                                    <View
                                        style={[
                                            styles.numberBadge,
                                            isCurrentTrack && styles.numberBadgeActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.numberText,
                                                isCurrentTrack && styles.numberTextActive,
                                            ]}
                                        >
                                            {item.number}
                                        </Text>
                                    </View>

                                    {/* Surah Titles */}
                                    <View style={styles.surahInfo}>
                                        <View style={styles.titleRow}>
                                            <Text
                                                style={[
                                                    styles.surahName,
                                                    isCurrentTrack && styles.surahNameActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.englishName}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.arabicNameInline,
                                                    isCurrentTrack && styles.arabicNameActive,
                                                ]}
                                            >
                                                ({item.name})
                                            </Text>
                                            {downloaded && (
                                                <View style={styles.offlinePill}>
                                                    <Ionicons name="checkmark" size={10} color="#10B981" />
                                                    <Text style={styles.offlinePillText}>Offline</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.surahMeaning} numberOfLines={1}>
                                            {item.meaning} • {item.numberOfAyahs} Ayat
                                        </Text>
                                    </View>

                                    {/* Actions: Download Button & Play Indicator */}
                                    <View style={styles.itemActionsRow}>
                                        {/* Download Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.downloadBtn,
                                                downloaded && styles.downloadBtnActive,
                                                downloading && styles.downloadBtnLoading,
                                            ]}
                                            onPress={() => handleToggleDownload(item)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            {downloading ? (
                                                <View style={styles.downloadSpinnerRow}>
                                                    <ActivityIndicator size="small" color="#10B981" />
                                                    <Text style={styles.downloadPercentText}>{progress}%</Text>
                                                </View>
                                            ) : downloaded ? (
                                                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                            ) : (
                                                <Ionicons name="arrow-down-circle-outline" size={22} color="rgba(255, 255, 255, 0.45)" />
                                            )}
                                        </TouchableOpacity>

                                        {/* Play / Active Indicator */}
                                        <View style={styles.itemAction}>
                                            {isCurrentTrack ? (
                                                <View style={styles.activeIconContainer}>
                                                    <Ionicons
                                                        name={isPlaying ? 'volume-high' : 'pause'}
                                                        size={20}
                                                        color="#10B981"
                                                    />
                                                </View>
                                            ) : (
                                                <Ionicons
                                                    name="play-circle-outline"
                                                    size={24}
                                                    color="rgba(255, 255, 255, 0.4)"
                                                />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheetContainer: {
        height: screenHeight * 0.85,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderLeftWidth: 0.5,
        borderRightWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(18, 18, 20, 0.88)',
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dragHandle: {
        width: 38,
        height: 4.5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    qariHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: Spacing.md,
    },
    avatarContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        backgroundColor: '#1E1E22',
        marginRight: Spacing.md,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    initialsAvatar: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    initialsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    qariDetails: {
        flex: 1,
    },
    qariName: {
        color: '#FFFFFF',
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    countryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    surahCountBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    fullQuranBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontWeight: '600',
    },
    fullQuranText: {
        color: '#10B981',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
    },
    closeBlur: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        marginHorizontal: Spacing.pagePadding,
        paddingHorizontal: 12,
        height: 42,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginBottom: Spacing.md,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 40,
    },
    surahItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    surahItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
    },
    numberBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    numberBadgeActive: {
        backgroundColor: '#10B981',
    },
    numberText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    numberTextActive: {
        color: '#FFFFFF',
    },
    surahInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    surahName: {
        color: '#FFFFFF',
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
    },
    surahNameActive: {
        color: '#10B981',
    },
    arabicNameInline: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 16,
        fontFamily: Typography.fontFamily.quran,
    },
    arabicNameActive: {
        color: 'rgba(16, 185, 129, 0.85)',
    },
    surahMeaning: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
    },
    itemAction: {
        marginLeft: 4,
    },
    itemActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    downloadBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadBtnActive: {},
    downloadBtnLoading: {
        width: 'auto',
        paddingHorizontal: 4,
    },
    downloadSpinnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    downloadPercentText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '700',
    },
    offlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
        gap: 2,
    },
    offlinePillText: {
        color: '#10B981',
        fontSize: 9,
        fontWeight: '600',
    },
    batchDownloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(56, 189, 248, 0.3)',
        gap: 4,
    },
    batchDownloadBtnDone: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    batchDownloadText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '600',
    },
    batchDownloadTextDone: {
        color: '#10B981',
    },
    batchProgressContainer: {
        marginHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.sm,
        padding: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 0.5,
        borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    batchProgressTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    batchProgressLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    batchProgressTitle: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    batchProgressSubtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
    },
    cancelBatchBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    cancelBatchText: {
        color: '#F87171',
        fontSize: 11,
        fontWeight: '600',
    },
    batchProgressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    batchProgressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    activeIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        gap: 10,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 14,
    },
});
