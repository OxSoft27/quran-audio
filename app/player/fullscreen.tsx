import { useAudio } from '@/context/AudioContext';
import { useDownload } from '@/context/DownloadContext';
import { useFavorites } from '@/context/FavoritesContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { PremiumPaywallModal } from '@/components/PremiumPaywallModal';
import { Ayah, fetchSurahText, QARIS, Surah, getAudioUrl } from '@/services/quranApi';
import { ALL_SURAHS, SurahItem } from '@/constants/surahsData';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    ScrollView,
    Image,
    TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FullscreenVideoBackground } from '@/components/FullscreenVideoBackground';

const { width, height } = Dimensions.get('window');

// Formatting helpers
const formatTime = (millis: number) => {
    if (!millis || millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AMBIENT_SOUNDS = [
    { id: 'none', name: 'Mati', icon: 'volume-mute', audio: null, video: null },
    {
        id: 'rain',
        name: 'Hujan',
        icon: 'cloud-rain',
        audio: require('@/assets/audio/ambient/rain.mp3'),
        video: require('@/assets/videos/ambient/rain.mp4'),
    },
    {
        id: 'fire',
        name: 'Api',
        icon: 'fire',
        audio: require('@/assets/audio/ambient/fireplace.mp3'),
        video: require('@/assets/videos/ambient/fireplace.mp4'),
    },
    {
        id: 'birds',
        name: 'Burung',
        icon: 'dove',
        audio: require('@/assets/audio/ambient/birds.mp3'),
        video: require('@/assets/videos/ambient/birds.mp4'),
    },
    {
        id: 'wind',
        name: 'Angin',
        icon: 'wind',
        audio: require('@/assets/audio/ambient/wind.mp3'),
        video: require('@/assets/videos/ambient/wind.mp4'),
    },
    {
        id: 'waves',
        name: 'Ombak',
        icon: 'water',
        audio: require('@/assets/audio/ambient/ocean.mp3'),
        video: require('@/assets/videos/ambient/ocean.mp4'),
    },
];

export default function FullscreenPlayer() {
    const router = useRouter();
    const {
        currentTrack,
        isPlaying,
        togglePlayPause,
        position,
        duration,
        seekTo,
        playNext,
        playPrevious,
        isShuffleOn,
        toggleShuffle,
        repeatMode,
        toggleRepeat,
        surahList,
        playbackSpeed,
        setPlaybackSpeed,
        playSurah,
        startSleepTimer,
        cancelSleepTimer,
        sleepTimerActive,
        volume: quranVolume,
        setVolume: setQuranVolume,
        selectedAmbient,
        setSelectedAmbient,
        ambientVolume,
        setAmbientVolume,
    } = useAudio();
    const { theme } = useTheme();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { playlists, addToPlaylist, createPlaylist } = usePlaylist();
    const {
        isSurahDownloaded,
        isSurahDownloading,
        downloadSurah,
        deleteDownloadedSurah,
    } = useDownload();
    const { isPremium } = useSubscription();
    const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);

    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState<{ arabic: Ayah[]; translation: Ayah[] } | null>(null);
    const [loadingLyrics, setLoadingLyrics] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    // Queue / Up Next Drawer State
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [queueSearchQuery, setQueueSearchQuery] = useState('');

    // Volume Mixer Modal State (Quran vs Background Sound)
    const [showVolumeModal, setShowVolumeModal] = useState(false);

    // Ambient Sounds State
    const [showAmbientModal, setShowAmbientModal] = useState(false);

    const currentAmbient = AMBIENT_SOUNDS.find((s) => s.id === selectedAmbient);
    const ambientVideoUrl = currentAmbient?.video;

    const { t, i18n } = useTranslation();

    const getAmbientLabel = (id: string) => {
        switch (id) {
            case 'none': return t('player.ambientOff', 'Mati');
            case 'rain': return t('player.ambientRain', 'Hujan');
            case 'fire': return t('player.ambientFire', 'Api');
            case 'birds': return t('player.ambientBirds', 'Burung Hutan');
            case 'wind': return t('player.ambientWind', 'Angin');
            case 'waves': return t('player.ambientWaves', 'Ombak Laut');
            default: return id;
        }
    };

    const handleSelectAmbient = (soundId: string) => {
        if (soundId !== 'none' && soundId !== 'rain' && !isPremium) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAmbientModal(false);
            setIsPremiumModalVisible(true);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedAmbient(soundId);
        setShowAmbientModal(false);
    };

    useEffect(() => {
        if (currentTrack?.surahNumber) {
            loadLyrics(currentTrack.surahNumber, i18n.language);
        }
    }, [currentTrack?.surahNumber, i18n.language]);

    const loadLyrics = async (number: number, langCode?: string) => {
        setLoadingLyrics(true);
        const data = await fetchSurahText(number, langCode);
        setLyrics(data);
        setLoadingLyrics(false);
    };

    const handleSlidingStart = () => {
        setIsSeeking(true);
    };

    const handleSlidingComplete = async (value: number) => {
        await seekTo(value);
        setIsSeeking(false);
    };

    const handleValueChange = (value: number) => {
        setSeekValue(value);
    };

    const handleToggleFavorite = () => {
        if (!currentTrack) return;
        const surah = surahList.find((s) => s.number === currentTrack.surahNumber);
        if (surah) toggleFavorite(surah);
    };

    const handleAddToPlaylist = () => {
        if (!currentTrack) return;
        const surah = surahList.find((s) => s.number === currentTrack.surahNumber);
        if (!surah) return;

        const options = [...playlists.map((p) => p.name), 'Buat Playlist Baru', 'Batal'];
        const cancelButtonIndex = options.length - 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                },
                (buttonIndex) => {
                    if (buttonIndex === cancelButtonIndex) return;

                    if (options[buttonIndex] === 'Buat Playlist Baru') {
                        Alert.prompt('Playlist Baru', 'Masukkan nama playlist', (text) => {
                            if (text) createPlaylist(text);
                        });
                    } else {
                        const playlist = playlists[buttonIndex];
                        addToPlaylist(playlist.id, surah);
                        Alert.alert('Sukses', `Ditambahkan ke ${playlist.name}`);
                    }
                }
            );
        } else {
            Alert.alert('Pilih Playlist', 'Tambahkan surah ini ke playlist', [
                { text: 'Buat Baru', onPress: () => Alert.alert('Info', 'Fitur buat baru tersedia di menu Playlist') },
                ...playlists.map((p) => ({
                    text: p.name,
                    onPress: () => {
                        addToPlaylist(p.id, surah);
                        Alert.alert('Sukses');
                    },
                })),
                { text: 'Batal', style: 'cancel' as const },
            ]);
        }
    };

    const cyclePlaybackSpeed = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
        const currentSpeed = playbackSpeed || 1.0;
        const currentIndex = speeds.indexOf(currentSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);
    };

    const handleSleepTimerPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const options = ['15 Menit', '30 Menit', '45 Menit', '60 Menit', 'Matikan Timer', 'Batal'];
        const minutes = [15, 30, 45, 60];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: options.length - 1,
                    destructiveButtonIndex: 4,
                    title: 'Timer Tidur',
                    message: sleepTimerActive
                        ? 'Timer tidur saat ini aktif'
                        : 'Pilih durasi sebelum pemutaran berhenti otomatis',
                },
                (index) => {
                    if (index < 4) {
                        startSleepTimer(minutes[index]);
                        Alert.alert('Timer Tidur Diatur', `Pemutaran akan berhenti dalam ${minutes[index]} menit.`);
                    } else if (index === 4) {
                        cancelSleepTimer();
                        Alert.alert('Timer Dibatalkan', 'Timer tidur telah dimatikan.');
                    }
                }
            );
        } else {
            Alert.alert('Timer Tidur', 'Pilih durasi timer', [
                { text: '15 Menit', onPress: () => startSleepTimer(15) },
                { text: '30 Menit', onPress: () => startSleepTimer(30) },
                { text: '60 Menit', onPress: () => startSleepTimer(60) },
                { text: 'Matikan Timer', onPress: cancelSleepTimer, style: 'destructive' },
                { text: 'Batal', style: 'cancel' },
            ]);
        }
    };

    const handlePlayFromQueue = (surahNumber: number, surahName: string) => {
        Haptics.selectionAsync();
        if (!currentTrack) return;
        const url = getAudioUrl(currentTrack.qariId, surahNumber);
        playSurah(url, {
            surahName,
            qariName: currentTrack.qariName,
            surahNumber,
            qariId: currentTrack.qariId,
        });
        setShowQueueModal(false);
    };

    const queueSurahs = useMemo(() => {
        const query = queueSearchQuery.trim().toLowerCase();
        if (!query) return ALL_SURAHS;
        return ALL_SURAHS.filter(
            (s) =>
                s.number.toString().includes(query) ||
                s.englishName.toLowerCase().includes(query) ||
                s.indonesianName.toLowerCase().includes(query) ||
                s.meaning.toLowerCase().includes(query) ||
                s.name.includes(query)
        );
    }, [queueSearchQuery]);

    if (!currentTrack) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>Tidak ada audio yang diputar</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: '#fff', marginTop: 12 }}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentPos = isSeeking ? seekValue : position;

    const isCurrentDownloaded = currentTrack
        ? isSurahDownloaded(currentTrack.qariId, currentTrack.surahNumber)
        : false;
    const isCurrentDownloading = currentTrack
        ? isSurahDownloading(currentTrack.qariId, currentTrack.surahNumber)
        : false;

    const handleToggleDownload = async () => {
        if (!currentTrack) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (isCurrentDownloading) return;

        if (isCurrentDownloaded) {
            Alert.alert(
                'Hapus Unduhan',
                `Hapus file offline untuk Surah ${currentTrack.surahName}?`,
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteDownloadedSurah(currentTrack.qariId, currentTrack.surahNumber);
                        },
                    },
                ]
            );
        } else {
            if (!isPremium) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsPremiumModalVisible(true);
                return;
            }
            const surahItem = ALL_SURAHS.find((s) => s.number === currentTrack.surahNumber);
            const qari = QARIS.find((q) => q.id === currentTrack.qariId) || QARIS[0];
            if (surahItem) {
                const success = await downloadSurah(qari, surahItem);
                if (success) {
                    Alert.alert('Berhasil Diunduh', `Surah ${currentTrack.surahName} kini dapat didengarkan secara offline.`);
                }
            }
        }
    };

    // Combine arabic and translation for lyrics
    const combinedLyrics =
        lyrics?.arabic.map((item, index) => ({
            id: item.number.toString(),
            arabic: item.text,
            translation: lyrics.translation[index]?.text || '',
            numberInSurah: item.numberInSurah,
        })) || [];

    // Active Qari Artwork
    const currentQari = QARIS.find((q) => q.id === currentTrack.qariId);
    const qariArtwork = currentQari?.image || require('@/assets/images/qaris/mishary.png');

    return (
        <View style={styles.container}>
            {/* Background Video Component with dark cinematic tone */}
            <FullscreenVideoBackground videoSource={ambientVideoUrl} isPlaying={isPlaying} />

            {/* Top Sheet Drag Handle (Matching frame_04.jpg) */}
            <View style={styles.topDragHandleContainer}>
                <View style={styles.topDragHandle} />
            </View>

            {/* Clean Top Bar: Dismiss Chevron on Left, Ambient Pill in Center */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.topDismissBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.topCircleBlur}>
                        <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.ambientPillButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAmbientModal(true);
                    }}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.ambientPillBlur}>
                        <FontAwesome5
                            name={currentAmbient?.icon || 'cloud-rain'}
                            size={12}
                            color="#FFFFFF"
                            style={{ marginRight: 6 }}
                        />
                        <Text style={styles.ambientPillText}>{getAmbientLabel(currentAmbient?.id || 'rain')}</Text>
                    </BlurView>
                </TouchableOpacity>

                {/* Right spacer for balanced alignment */}
                <View style={{ width: 42 }} />
            </View>

            {/* Ambient Sounds Modal (iOS Frosted Glass Sheet) */}
            <Modal visible={showAmbientModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowAmbientModal(false)}
                    />
                    <BlurView intensity={85} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('player.ambientTitle', 'Suara Latar (Ambient)')}</Text>
                            <TouchableOpacity onPress={() => setShowAmbientModal(false)}>
                                <BlurView intensity={40} tint="dark" style={styles.closeBlurButton}>
                                    <Ionicons name="close" size={20} color="#FFF" />
                                </BlurView>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingHorizontal: Spacing.pagePadding,
                                paddingBottom: Spacing.sm + 2,
                            }}
                        >
                            {AMBIENT_SOUNDS.map((sound) => {
                                const isLocked = sound.id !== 'none' && sound.id !== 'rain' && !isPremium;
                                const isSelected = selectedAmbient === sound.id;
                                return (
                                    <TouchableOpacity
                                        key={sound.id}
                                        style={[
                                            styles.ambientOption,
                                            isSelected && styles.ambientOptionSelected,
                                        ]}
                                        onPress={() => handleSelectAmbient(sound.id)}
                                        activeOpacity={0.8}
                                    >
                                        <BlurView
                                            intensity={isSelected ? 70 : 30}
                                            tint="dark"
                                            style={styles.ambientOptionBlur}
                                        >
                                            {isLocked && (
                                                <View style={styles.ambientLockBadge}>
                                                    <Ionicons name="lock-closed" size={10} color="#F59E0B" />
                                                </View>
                                            )}
                                            <FontAwesome5
                                                name={sound.icon}
                                                size={22}
                                                color={isLocked ? "rgba(255, 255, 255, 0.6)" : "#FFF"}
                                            />
                                            <Text
                                                style={[
                                                    styles.ambientOptionText,
                                                    isSelected && { color: '#FFF', fontWeight: 'bold' },
                                                    isLocked && { color: 'rgba(255, 255, 255, 0.6)' },
                                                ]}
                                            >
                                                {getAmbientLabel(sound.id)}
                                            </Text>
                                        </BlurView>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </BlurView>
                </View>
            </Modal>

            {/* Main Player Area */}
            <View style={styles.content}>
                {showLyrics ? (
                    <View style={styles.lyricsContainer}>
                        {loadingLyrics ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: 12, fontSize: 13 }}>
                                    {t('player.lyricsLoading', 'Memuat terjemahan...')}
                                </Text>
                            </View>
                        ) : combinedLyrics.length === 0 ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <Ionicons name="document-text-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: 10, fontSize: 14 }}>
                                    {t('player.lyricsEmpty', 'Terjemahan lirik belum tersedia')}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={combinedLyrics}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: Spacing.pagePadding }}
                                renderItem={({ item }) => (
                                    <View style={styles.lyricItem}>
                                        <View style={styles.ayahBadge}>
                                            <Text style={styles.ayahNumber}>{item.numberInSurah}</Text>
                                        </View>
                                        <Text style={styles.arabicText}>{item.arabic}</Text>
                                        <Text style={styles.translationText}>{item.translation}</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                ) : (
                    <>
                        {/* Flexible Spacer */}
                        <View style={{ flex: 1 }} />

                        {/* Track Info Row (Avatar, Surah Name, Reciter, Star) */}
                        <View style={styles.infoRow}>
                            <View style={styles.qariAvatarContainer}>
                                <Image source={qariArtwork} style={styles.qariAvatar} resizeMode="cover" />
                            </View>

                            <View style={styles.infoTextContainer}>
                                <Text style={styles.surahName} numberOfLines={1}>
                                    {currentTrack.surahName}
                                </Text>
                                <Text style={styles.qariName} numberOfLines={1}>
                                    {currentTrack.qariName}
                                </Text>
                            </View>

                            <View style={styles.infoRightActions}>
                                <TouchableOpacity
                                    onPress={handleToggleDownload}
                                    style={styles.actionCircleBtn}
                                    activeOpacity={0.7}
                                >
                                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.actionCircleBlur}>
                                        {isCurrentDownloading ? (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        ) : (
                                            <Ionicons
                                                name={isCurrentDownloaded ? 'checkmark-circle' : !isPremium ? 'lock-closed-outline' : 'arrow-down-circle-outline'}
                                                size={isCurrentDownloaded || isPremium ? 20 : 18}
                                                color={isCurrentDownloaded ? '#10B981' : !isPremium ? '#F59E0B' : '#FFFFFF'}
                                            />
                                        )}
                                    </BlurView>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleAddToPlaylist}
                                    style={styles.actionCircleBtn}
                                    activeOpacity={0.7}
                                >
                                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.actionCircleBlur}>
                                        <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" />
                                    </BlurView>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleToggleFavorite}
                                    style={styles.actionCircleBtn}
                                    activeOpacity={0.7}
                                >
                                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.actionCircleBlur}>
                                        <Ionicons
                                            name={
                                                currentTrack && isFavorite(currentTrack.surahNumber)
                                                    ? 'star'
                                                    : 'star-outline'
                                            }
                                            size={20}
                                            color={
                                                currentTrack && isFavorite(currentTrack.surahNumber)
                                                    ? '#FFD700'
                                                    : '#FFFFFF'
                                            }
                                        />
                                    </BlurView>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Progress Bar & Elapsed / Remaining Time */}
                <View style={styles.progressContainer}>
                    <Slider
                        style={{ width: '100%', height: 30 }}
                        minimumValue={0}
                        maximumValue={duration || 1}
                        value={currentPos}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        onValueChange={handleValueChange}
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.25)"
                        thumbTintColor="#FFFFFF"
                    />
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
                        <Text style={styles.timeText}>
                            {duration > 0 ? `-${formatTime(Math.max(0, duration - currentPos))}` : '--:--'}
                        </Text>
                    </View>
                </View>

                {/* Controls Row: Speed 1x, Prev, Play/Pause Hero, Next, Sleep Timer */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={cyclePlaybackSpeed} style={styles.speedSubButton} activeOpacity={0.75}>
                        <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.controlCircleBlur}>
                            <Text style={styles.speedText}>{playbackSpeed || 1.0}x</Text>
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playPrevious} style={styles.skipButton} activeOpacity={0.75}>
                        <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.skipCircleBlur}>
                            <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playButtonWrapper}
                        onPress={togglePlayPause}
                        activeOpacity={0.85}
                    >
                        <BlurView intensity={65} tint="systemUltraThinMaterial" style={styles.playButton}>
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={34}
                                color="#FFFFFF"
                                style={{ marginLeft: isPlaying ? 0 : 3 }}
                            />
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext} style={styles.skipButton} activeOpacity={0.75}>
                        <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.skipCircleBlur}>
                            <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSleepTimerPress}
                        style={styles.sleepButton}
                        activeOpacity={0.75}
                    >
                        <BlurView
                            intensity={45}
                            tint="systemUltraThinMaterial"
                            style={[styles.controlCircleBlur, sleepTimerActive && styles.activeControlBlur]}
                        >
                            <Ionicons
                                name="moon"
                                size={18}
                                color={sleepTimerActive ? '#10B981' : '#FFFFFF'}
                            />
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Actions Bar: Volume, Qaf / Lyrics, AirPlay, Queue List */}
            <View style={styles.bottomActionsBar}>
                <TouchableOpacity
                    style={styles.bottomIconBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowVolumeModal(prev => !prev);
                    }}
                    activeOpacity={0.75}
                >
                    <BlurView
                        intensity={showVolumeModal ? 70 : 45}
                        tint="systemUltraThinMaterial"
                        style={[styles.bottomIconBlur, showVolumeModal && styles.bottomIconBlurActive]}
                    >
                        <Ionicons
                            name={showVolumeModal ? "volume-high" : "volume-high-outline"}
                            size={20}
                            color={showVolumeModal ? "#10B981" : "#FFFFFF"}
                        />
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomIconBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowLyrics(!showLyrics);
                    }}
                    activeOpacity={0.75}
                >
                    <BlurView
                        intensity={showLyrics ? 70 : 45}
                        tint="systemUltraThinMaterial"
                        style={[styles.bottomIconBlur, showLyrics && styles.bottomIconBlurActive]}
                    >
                        <Text style={[styles.qafText, showLyrics && styles.qafTextActive]}>ق</Text>
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomIconBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert('AirPlay & Perangkat', 'Menghubungkan ke speaker eksternal atau headphone Bluetooth.');
                    }}
                    activeOpacity={0.75}
                >
                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.bottomIconBlur}>
                        <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomIconBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowQueueModal(true);
                    }}
                    activeOpacity={0.75}
                >
                    <BlurView intensity={45} tint="systemUltraThinMaterial" style={styles.bottomIconBlur}>
                        <Ionicons name="list-outline" size={22} color="#FFFFFF" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Audio Volume Mixer Modal (Quran & Ambient Sound) matching competitor design */}
            <Modal visible={showVolumeModal} transparent animationType="fade">
                <View style={styles.volumeModalBackdrop}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowVolumeModal(false)}
                    />
                    <View style={styles.volumeCardPositioner} pointerEvents="box-none">
                        <BlurView intensity={85} tint="dark" style={styles.volumeCard}>
                            {/* Quran Volume Section */}
                            <View style={styles.volumeSection}>
                                <View style={styles.volumeHeaderRow}>
                                    <Text style={styles.volumeSectionTitle}>Quran</Text>
                                    <Text style={styles.volumePercentText}>{Math.round(quranVolume * 100)}%</Text>
                                </View>
                                <View style={styles.volumeSliderRow}>
                                    <Ionicons name="volume-low-outline" size={18} color="rgba(255,255,255,0.55)" />
                                    <Slider
                                        style={styles.volumeSlider}
                                        value={quranVolume}
                                        minimumValue={0}
                                        maximumValue={1}
                                        step={0.01}
                                        onValueChange={(val) => setQuranVolume(val)}
                                        minimumTrackTintColor="#FFFFFF"
                                        maximumTrackTintColor="rgba(255, 255, 255, 0.25)"
                                        thumbTintColor="#FFFFFF"
                                    />
                                    <Ionicons name="volume-high-outline" size={18} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>

                            <View style={styles.volumeDivider} />

                            {/* Background / Ambient Sound Volume Section */}
                            <View style={styles.volumeSection}>
                                <View style={styles.volumeHeaderRow}>
                                    <View style={styles.ambientTitleRow}>
                                        <Text style={styles.volumeSectionTitle}>Background sound</Text>
                                        {currentAmbient && selectedAmbient !== 'none' && (
                                            <TouchableOpacity
                                                style={styles.ambientMiniBadge}
                                                onPress={() => {
                                                    setShowVolumeModal(false);
                                                    setShowAmbientModal(true);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <FontAwesome5
                                                    name={currentAmbient.icon as any || 'cloud-rain'}
                                                    size={11}
                                                    color="#10B981"
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text style={styles.ambientMiniBadgeText}>{currentAmbient.name}</Text>
                                                <Ionicons name="chevron-forward" size={10} color="rgba(255,255,255,0.5)" style={{ marginLeft: 2 }} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.volumePercentText}>{Math.round(ambientVolume * 100)}%</Text>
                                </View>
                                <View style={styles.volumeSliderRow}>
                                    <Ionicons name="volume-low-outline" size={18} color="rgba(255,255,255,0.55)" />
                                    <Slider
                                        style={styles.volumeSlider}
                                        value={ambientVolume}
                                        minimumValue={0}
                                        maximumValue={1}
                                        step={0.01}
                                        onValueChange={(val) => {
                                            setAmbientVolume(val);
                                            // If ambient was none and user pulls slider up, activate rain
                                            if (selectedAmbient === 'none' && val > 0) {
                                                handleSelectAmbient('rain');
                                            }
                                        }}
                                        minimumTrackTintColor="#FFFFFF"
                                        maximumTrackTintColor="rgba(255, 255, 255, 0.25)"
                                        thumbTintColor="#FFFFFF"
                                    />
                                    <Ionicons name="volume-high-outline" size={18} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </View>
            </Modal>

            {/* Lanjut Memutar / Queue Drawer Modal (Matching second_03.jpg) */}
            <Modal visible={showQueueModal} transparent animationType="slide">
                <View style={styles.queueModalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowQueueModal(false)}
                    />
                    <BlurView intensity={90} tint="dark" style={styles.queueModalContent}>
                        {/* Drag Handle */}
                        <View style={styles.modalDragHandleContainer}>
                            <View style={styles.modalDragHandle} />
                        </View>

                        {/* Header with Shuffle & Repeat */}
                        <View style={styles.queueHeader}>
                            <View>
                                <Text style={styles.queueTitle}>Lanjut Memutar</Text>
                                <Text style={styles.queueSubtitle}>
                                    {ALL_SURAHS.length} surah dalam daftar putar
                                </Text>
                            </View>
                            <View style={styles.queueHeaderRight}>
                                <TouchableOpacity onPress={toggleShuffle} style={styles.queueHeaderAction}>
                                    <Ionicons
                                        name="shuffle"
                                        size={20}
                                        color={isShuffleOn ? '#10B981' : 'rgba(255,255,255,0.5)'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={toggleRepeat} style={styles.queueHeaderAction}>
                                    <Ionicons
                                        name="repeat"
                                        size={20}
                                        color={repeatMode !== 'off' ? '#10B981' : 'rgba(255,255,255,0.5)'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowQueueModal(false)}
                                    style={styles.queueCloseBtn}
                                >
                                    <Ionicons name="close" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Search Input */}
                        <View style={styles.queueSearchContainer}>
                            <Ionicons
                                name="search"
                                size={16}
                                color="rgba(255,255,255,0.5)"
                                style={{ marginRight: 8 }}
                            />
                            <TextInput
                                style={styles.queueSearchInput}
                                placeholder="Cari surah dalam daftar..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={queueSearchQuery}
                                onChangeText={setQueueSearchQuery}
                            />
                            {queueSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setQueueSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Surahs List matching second_03.jpg */}
                        <FlatList
                            data={queueSurahs}
                            keyExtractor={(item) => item.number.toString()}
                            contentContainerStyle={{ paddingBottom: Spacing.pagePadding + 20 }}
                            renderItem={({ item }) => {
                                const isCurrent = currentTrack?.surahNumber === item.number;
                                return (
                                    <TouchableOpacity
                                        style={[styles.queueItem, isCurrent && styles.queueItemActive]}
                                        onPress={() => handlePlayFromQueue(item.number, item.englishName)}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[styles.queueNumBadge, isCurrent && styles.queueNumBadgeActive]}
                                        >
                                            <Text
                                                style={[
                                                    styles.queueNumText,
                                                    isCurrent && styles.queueNumTextActive,
                                                ]}
                                            >
                                                {item.number}
                                            </Text>
                                        </View>
                                        <View style={styles.queueItemDetails}>
                                            <View style={styles.queueTitleRow}>
                                                <Text
                                                    style={[
                                                        styles.queueItemName,
                                                        isCurrent && styles.queueItemNameActive,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.englishName} ({item.name})
                                                </Text>
                                            </View>
                                            <Text style={styles.queueItemSub} numberOfLines={1}>
                                                {item.meaning}
                                            </Text>
                                        </View>
                                        <View style={styles.queueItemRight}>
                                            {isCurrent ? (
                                                <Ionicons
                                                    name={isPlaying ? 'volume-high' : 'pause'}
                                                    size={20}
                                                    color="#10B981"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name="reorder-two-outline"
                                                    size={22}
                                                    color="rgba(255, 255, 255, 0.35)"
                                                />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </BlurView>
                </View>
            </Modal>

            {/* Premium Paywall Modal */}
            <PremiumPaywallModal
                visible={isPremiumModalVisible}
                onClose={() => setIsPremiumModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    topDragHandleContainer: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 12 : 8,
        paddingBottom: 4,
    },
    topDragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: 6,
        paddingBottom: Spacing.xs,
        zIndex: 20,
    },
    topDismissBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    topCircleBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        borderRadius: 20,
    },
    ambientPillButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    ambientPillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        borderRadius: 20,
    },
    ambientPillText: {
        color: '#FFFFFF',
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.pagePadding,
        justifyContent: 'flex-end',
        paddingBottom: Spacing.md,
    },
    lyricsContainer: {
        flex: 1,
        marginBottom: Spacing.pagePadding,
    },
    lyricItem: {
        marginBottom: Spacing.xl,
    },
    ayahBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Spacing.xs,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        marginBottom: Spacing.sm,
    },
    ayahNumber: {
        color: '#FFFFFF',
        fontSize: Typography.size.caption1,
        fontWeight: 'bold',
    },
    arabicText: {
        color: '#FFF',
        fontSize: Typography.size.title2,
        textAlign: 'right',
        marginBottom: Spacing.sm,
        lineHeight: 40,
    },
    translationText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: Typography.size.subhead,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: Spacing.lg,
        paddingHorizontal: Spacing.xs,
    },
    qariAvatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        marginRight: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 4,
    },
    qariAvatar: {
        width: '100%',
        height: '100%',
    },
    infoTextContainer: {
        alignItems: 'flex-start',
        flex: 1,
        paddingHorizontal: Spacing.xs,
    },
    surahName: {
        color: '#FFF',
        fontSize: Typography.size.title2,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        marginBottom: 2,
        textAlign: 'left',
        letterSpacing: Typography.tracking.display,
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    qariName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        textAlign: 'left',
        letterSpacing: Typography.tracking.subhead,
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    infoRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionCircleBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    actionCircleBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        borderRadius: 21,
    },
    progressContainer: {
        width: '100%',
        marginVertical: Spacing.sm,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xs,
        marginTop: 4,
    },
    timeText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: Typography.size.caption1,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 380,
        alignSelf: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginTop: Spacing.xs,
    },
    speedSubButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    controlCircleBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        borderRadius: 22,
    },
    activeControlBlur: {
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        borderColor: 'rgba(16, 185, 129, 0.6)',
    },
    speedText: {
        color: '#FFFFFF',
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    skipButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    skipCircleBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        borderRadius: 24,
    },
    playButtonWrapper: {
        width: 74,
        height: 74,
        borderRadius: 37,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    playButton: {
        width: '100%',
        height: '100%',
        borderRadius: 37,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.28)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    sleepButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    bottomActionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: Spacing.pagePadding * 1.5,
        paddingBottom: Platform.OS === 'ios' ? Spacing.xl + 8 : Spacing.lg,
        paddingTop: Spacing.sm,
    },
    bottomIconBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 3,
    },
    bottomIconBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 23,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    bottomIconBlurActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.28)',
        borderColor: 'rgba(16, 185, 129, 0.65)',
    },
    qafText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    qafTextActive: {
        color: '#10B981',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 44 : Spacing.xl,
        minHeight: 220,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderLeftWidth: 0.5,
        borderRightWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(15, 18, 24, 0.88)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.pagePadding,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: Typography.size.body,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    closeBlurButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    ambientOption: {
        marginHorizontal: 6,
        marginTop: Spacing.md,
        width: 82,
        height: 88,
        borderRadius: 18,
        overflow: 'hidden',
    },
    ambientOptionBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    ambientOptionSelected: {
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    ambientOptionText: {
        color: 'rgba(255,255,255,0.85)',
        marginTop: 8,
        fontSize: Typography.size.caption1,
        fontWeight: Typography.weight.medium,
    },
    queueModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    queueModalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '75%',
        overflow: 'hidden',
        borderTopWidth: 1,
        borderLeftWidth: 0.5,
        borderRightWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(14, 18, 24, 0.94)',
        paddingTop: Spacing.xs,
    },
    modalDragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    modalDragHandle: {
        width: 38,
        height: 4.5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    queueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: Spacing.sm,
    },
    queueTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    queueSubtitle: {
        fontSize: Typography.size.caption2,
        color: 'rgba(255, 255, 255, 0.55)',
        marginTop: 2,
    },
    queueHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    queueHeaderAction: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        marginHorizontal: Spacing.pagePadding,
        paddingHorizontal: 12,
        height: 38,
        marginBottom: Spacing.sm,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    queueSearchInput: {
        flex: 1,
        fontSize: Typography.size.footnote,
        color: '#FFFFFF',
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: Spacing.pagePadding,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    },
    queueItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    queueNumBadge: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    queueNumBadgeActive: {
        backgroundColor: '#10B981',
    },
    queueNumText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.75)',
    },
    queueNumTextActive: {
        color: '#FFFFFF',
    },
    queueItemDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    queueTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    queueItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    queueItemNameActive: {
        color: '#10B981',
        fontWeight: '700',
    },
    queueItemSub: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.45)',
        marginTop: 2,
    },
    queueItemRight: {
        marginLeft: 12,
    },
    // Volume Mixer Modal Styles (Matching competitor design)
    volumeModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
        paddingBottom: Platform.OS === 'ios' ? 140 : 120,
        alignItems: 'center',
    },
    volumeCardPositioner: {
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    volumeCard: {
        width: '100%',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: 'rgba(22, 26, 34, 0.82)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    volumeSection: {
        width: '100%',
    },
    volumeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    volumeSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    volumePercentText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.55)',
        fontVariant: ['tabular-nums'],
    },
    volumeSliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    volumeSlider: {
        flex: 1,
        height: 32,
        marginHorizontal: 8,
    },
    volumeDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginVertical: 14,
    },
    ambientTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ambientMiniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    ambientMiniBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10B981',
    },
    ambientLockBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.25)',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.45)',
        zIndex: 5,
    },
});
