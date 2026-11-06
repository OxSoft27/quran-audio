import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { usePlaylist, Playlist } from '@/context/PlaylistContext';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { QARIS, getAudioUrl, Surah } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PlaylistScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { playlists, createPlaylist, deletePlaylist, removeFromPlaylist } = usePlaylist();
    const { playSurah, currentTrack, isPlaying } = useAudio();

    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const handleOpenCreateModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Buat Playlist Baru',
                'Masukkan nama daftar putar:',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Buat',
                        onPress: (text?: string) => {
                            if (text && text.trim()) {
                                createPlaylist(text.trim());
                            }
                        },
                    },
                ],
                'plain-text'
            );
        } else {
            setNewPlaylistName('');
            setIsCreateModalVisible(true);
        }
    };

    const handleConfirmCreateAndroid = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName.trim());
            setNewPlaylistName('');
            setIsCreateModalVisible(false);
        }
    };

    const handleSelectPlaylist = (playlist: Playlist) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlaylist(playlist);
    };

    const handlePlaySurahInPlaylist = (surah: Surah) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const qari = currentTrack?.qariId ? QARIS.find((q) => q.id === currentTrack.qariId) || QARIS[0] : QARIS[0];
        const url = getAudioUrl(qari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: qari.name,
            surahNumber: surah.number,
            qariId: qari.id,
        });
    };

    const handlePlayAll = () => {
        if (!selectedPlaylist || selectedPlaylist.surahs.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handlePlaySurahInPlaylist(selectedPlaylist.surahs[0]);
    };

    const handleDeletePlaylist = (playlist: Playlist) => {
        Alert.alert(
            'Hapus Playlist',
            `Apakah Anda yakin ingin menghapus playlist "${playlist.name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        await deletePlaylist(playlist.id);
                        if (selectedPlaylist?.id === playlist.id) {
                            setSelectedPlaylist(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRemoveSurah = (playlistId: string, surah: Surah) => {
        Alert.alert(
            'Hapus dari Playlist',
            `Hapus Surah ${surah.englishName} dari playlist ini?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFromPlaylist(playlistId, surah.number);
                        if (selectedPlaylist) {
                            setSelectedPlaylist({
                                ...selectedPlaylist,
                                surahs: selectedPlaylist.surahs.filter((s) => s.number !== surah.number),
                            });
                        }
                    },
                },
            ]
        );
    };

    // Live version of selected playlist to reflect updates
    const activePlaylist = selectedPlaylist
        ? playlists.find((p) => p.id === selectedPlaylist.id) || selectedPlaylist
        : null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F4F4F5' }]}>
            <Stack.Screen
                options={{
                    title: 'Daftar Putar Saya',
                    headerShown: true,
                    headerStyle: { backgroundColor: isDark ? '#09090B' : '#F4F4F5' },
                    headerTitleStyle: {
                        color: isDark ? '#FFFFFF' : '#111827',
                        fontFamily: Typography.fontFamily.display,
                        fontWeight: Typography.weight.bold,
                    },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[
                                styles.headerBtn,
                                {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={22}
                                color={isDark ? '#FFFFFF' : '#111827'}
                                style={{ marginRight: 1.5 }}
                            />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleOpenCreateModal}
                            style={[
                                styles.headerBtn,
                                {
                                    backgroundColor: '#10B981',
                                    borderColor: 'transparent',
                                },
                            ]}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="add" size={24} color="#000000" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.content}>
                {playlists.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="musical-notes-outline" size={48} color="#10B981" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            Belum Ada Daftar Putar
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Buat daftar putar pribadi Anda untuk mengelompokkan surah-surah favorit dan dengarkan kapan saja.
                        </Text>
                        <TouchableOpacity
                            style={styles.createCtaButton}
                            onPress={handleOpenCreateModal}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add-circle" size={20} color="#000000" style={{ marginRight: 8 }} />
                            <Text style={styles.createCtaText}>Buat Playlist Baru</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={playlists}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: Spacing.pagePadding, paddingBottom: 120 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.playlistCard,
                                    {
                                        backgroundColor: isDark ? '#141417' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                    },
                                ]}
                                onPress={() => handleSelectPlaylist(item)}
                                activeOpacity={0.75}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.cardIconWrap}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="list" size={22} color="#FFFFFF" />
                                </LinearGradient>

                                <View style={styles.cardInfo}>
                                    <Text
                                        style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text
                                        style={[styles.cardCount, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                    >
                                        {item.surahs.length} Surah tersimpan
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleDeletePlaylist(item)}
                                    style={styles.deleteCardBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#F87171" />
                                </TouchableOpacity>

                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                                    style={{ marginLeft: 8 }}
                                />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Playlist Detail Modal Sheet */}
            {activePlaylist && (
                <Modal
                    visible={true}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setSelectedPlaylist(null)}
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
                                    onPress={() => setSelectedPlaylist(null)}
                                >
                                    <Ionicons name="close" size={22} color="#FFFFFF" />
                                </TouchableOpacity>
                                <View style={styles.modalHeaderTitleWrap}>
                                    <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                                        {activePlaylist.name}
                                    </Text>
                                    <Text style={styles.modalHeaderSub}>
                                        {activePlaylist.surahs.length} Surah dalam playlist ini
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDeletePlaylist(activePlaylist)}
                                    style={styles.modalDeleteBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#F87171" />
                                </TouchableOpacity>
                            </View>

                            {activePlaylist.surahs.length > 0 ? (
                                <>
                                    {/* Play All CTA */}
                                    <View style={styles.playAllWrap}>
                                        <TouchableOpacity
                                            style={styles.playAllBtn}
                                            onPress={handlePlayAll}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="play" size={20} color="#000000" style={{ marginRight: 8 }} />
                                            <Text style={styles.playAllBtnText}>Putar Semua</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Surah List in Playlist */}
                                    <FlatList
                                        data={activePlaylist.surahs}
                                        keyExtractor={(item) => item.number.toString()}
                                        contentContainerStyle={styles.modalList}
                                        renderItem={({ item, index }) => {
                                            const isPlayingThis =
                                                currentTrack?.surahNumber === item.number && isPlaying;

                                            return (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.playlistSurahItem,
                                                        isPlayingThis && styles.playlistSurahActive,
                                                    ]}
                                                    onPress={() => handlePlaySurahInPlaylist(item)}
                                                    activeOpacity={0.75}
                                                >
                                                    <Text style={styles.playlistSurahIndex}>{index + 1}</Text>
                                                    <View style={styles.playlistSurahInfo}>
                                                        <Text style={styles.playlistSurahName}>
                                                            {item.englishName}
                                                        </Text>
                                                        <Text style={styles.playlistSurahMeta}>
                                                            {item.englishNameTranslation || item.name} • {item.numberOfAyahs} Ayat
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.playlistArabicName}>{item.name}</Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleRemoveSurah(activePlaylist.id, item)}
                                                        style={styles.removeSurahBtn}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Ionicons name="close-circle-outline" size={20} color="rgba(255, 255, 255, 0.4)" />
                                                    </TouchableOpacity>
                                                </TouchableOpacity>
                                            );
                                        }}
                                    />
                                </>
                            ) : (
                                <View style={styles.emptyPlaylistModalContainer}>
                                    <Ionicons name="folder-open-outline" size={54} color="rgba(255, 255, 255, 0.3)" />
                                    <Text style={styles.emptyPlaylistModalTitle}>Playlist Ini Masih Kosong</Text>
                                    <Text style={styles.emptyPlaylistModalSub}>
                                        Buka pemutar surah, lalu ketuk ikon bookmark (tanda buku) untuk menambahkan surah ke playlist ini.
                                    </Text>
                                </View>
                            )}
                        </SafeAreaView>
                    </View>
                </Modal>
            )}

            {/* Android / Cross-platform Create Playlist Modal */}
            <Modal
                visible={isCreateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsCreateModalVisible(false)}
            >
                <View style={styles.createModalOverlay}>
                    <View style={[styles.createModalCard, { backgroundColor: isDark ? '#1F1F23' : '#FFFFFF' }]}>
                        <Text style={[styles.createModalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            Buat Playlist Baru
                        </Text>
                        <TextInput
                            style={[
                                styles.createModalInput,
                                {
                                    backgroundColor: isDark ? '#2D2D32' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#111827',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                },
                            ]}
                            placeholder="Contoh: Murattal Subuh, Harian..."
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            autoFocus
                        />
                        <View style={styles.createModalActions}>
                            <TouchableOpacity
                                style={styles.createModalBtnCancel}
                                onPress={() => setIsCreateModalVisible(false)}
                            >
                                <Text style={[styles.createModalBtnTextCancel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Batal
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.createModalBtnSubmit}
                                onPress={handleConfirmCreateAndroid}
                            >
                                <Text style={styles.createModalBtnTextSubmit}>Buat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 1,
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
    },
    emptyIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: Typography.size.title3,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: Typography.size.subhead,
        fontFamily: Typography.fontFamily.text,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    createCtaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 24,
    },
    createCtaText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: Typography.fontFamily.primary,
    },
    playlistCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        marginBottom: 3,
    },
    cardCount: {
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
    },
    deleteCardBtn: {
        padding: 6,
        borderRadius: 8,
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
        marginRight: 14,
    },
    modalHeaderTitleWrap: {
        flex: 1,
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalHeaderSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        marginTop: 2,
    },
    modalDeleteBtn: {
        padding: 8,
    },
    playAllWrap: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: 16,
    },
    playAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
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
        marginRight: 8,
    },
    playlistSurahName: {
        fontSize: 16,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
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
        marginRight: 10,
    },
    removeSurahBtn: {
        padding: 4,
    },
    emptyPlaylistModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        gap: 12,
    },
    emptyPlaylistModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 8,
    },
    emptyPlaylistModalSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        lineHeight: 20,
    },
    createModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    createModalCard: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    createModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    createModalInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 20,
    },
    createModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    createModalBtnCancel: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    createModalBtnTextCancel: {
        fontSize: 15,
        fontWeight: '600',
    },
    createModalBtnSubmit: {
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    createModalBtnTextSubmit: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '700',
    },
});
