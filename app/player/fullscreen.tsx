import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTheme } from '@/context/ThemeContext';
import { Ayah, fetchSurahText } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Formatting helpers
const formatTime = (millis: number) => {
    if (millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function FullscreenPlayer() {
    const router = useRouter();
    const { currentTrack, isPlaying, togglePlayPause, position, duration, seekTo, playNext, playPrevious, isShuffleOn, toggleShuffle, repeatMode, toggleRepeat, surahList } = useAudio();
    const { theme } = useTheme();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { playlists, addToPlaylist, createPlaylist } = usePlaylist();

    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState<{ arabic: Ayah[], translation: Ayah[] } | null>(null);
    const [loadingLyrics, setLoadingLyrics] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    useEffect(() => {
        if (currentTrack?.surahNumber) {
            loadLyrics(currentTrack.surahNumber);
        }
    }, [currentTrack?.surahNumber]);

    const loadLyrics = async (number: number) => {
        setLoadingLyrics(true);
        const data = await fetchSurahText(number);
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
        const surah = surahList.find(s => s.number === currentTrack.surahNumber);
        if (surah) toggleFavorite(surah);
    };

    const handleAddToPlaylist = () => {
        if (!currentTrack) return;
        const surah = surahList.find(s => s.number === currentTrack.surahNumber);
        if (!surah) return;

        const options = [...playlists.map(p => p.name), 'Buat Playlist Baru', 'Batal'];
        const cancelButtonIndex = options.length - 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                options,
                cancelButtonIndex
            }, (buttonIndex) => {
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
            });
        } else {
            Alert.alert(
                'Pilih Playlist',
                'Tambahkan surah ini ke playlist',
                [
                    { text: 'Buat Baru', onPress: () => Alert.alert('Info', 'Fitur buat baru tersedia di menu Playlist') },
                    ...playlists.map(p => ({ text: p.name, onPress: () => { addToPlaylist(p.id, surah); Alert.alert('Sukses'); } })),
                    { text: 'Batal', style: 'cancel' }
                ]
            );
        }
    };

    if (!currentTrack) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>No track playing</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
            </View>
        );
    }

    // Use seekValue while seeking, otherwise actual position
    const currentPos = isSeeking ? seekValue : position;

    // Combine arabic and translation for list
    const combinedLyrics = lyrics?.arabic.map((item, index) => ({
        id: item.number.toString(),
        arabic: item.text,
        translation: lyrics.translation[index]?.text || '',
        numberInSurah: item.numberInSurah
    })) || [];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F1C1B', '#1DB8B5']}
                start={{ x: 0.5, y: 0.8 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.background}
            />

            {/* Visual Pattern overlay */}
            <Ionicons name="apps" size={width * 1.5} color="rgba(255,255,255,0.03)" style={styles.pattern} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="chevron-down" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sedang Diputar</Text>
                <TouchableOpacity style={styles.headerButton} onPress={() => setShowLyrics(!showLyrics)}>
                    <Ionicons name={showLyrics ? "musical-note" : "text"} size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {showLyrics ? (
                    <View style={styles.lyricsContainer}>
                        {loadingLyrics ? (
                            <ActivityIndicator size="large" color="#FFF" />
                        ) : (
                            <FlatList
                                data={combinedLyrics}
                                keyExtractor={item => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 20 }}
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
                        {/* Artwork */}
                        <View style={styles.artworkContainer}>
                            <LinearGradient
                                colors={['#1DB8B5', '#0F5F5D']}
                                style={styles.artwork}
                            >
                                <Ionicons name="moon" size={120} color="rgba(255,255,255,0.2)" />
                            </LinearGradient>
                        </View>

                        {/* Info Row */}
                        <View style={styles.infoRow}>
                            <TouchableOpacity onPress={handleAddToPlaylist}>
                                <Ionicons name="list-circle-outline" size={30} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>

                            <View style={styles.infoTextContainer}>
                                <Text style={styles.surahName}>{currentTrack.surahName}</Text>
                                <Text style={styles.qariName}>{currentTrack.qariName}</Text>
                            </View>

                            <TouchableOpacity onPress={handleToggleFavorite}>
                                <Ionicons
                                    name={currentTrack && isFavorite(currentTrack.surahNumber) ? "heart" : "heart-outline"}
                                    size={30}
                                    color={currentTrack && isFavorite(currentTrack.surahNumber) ? "#1DB8B5" : "rgba(255,255,255,0.8)"}
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={0}
                        maximumValue={duration}
                        value={currentPos}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        onValueChange={handleValueChange}
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#FFFFFF"
                    />
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    <TouchableOpacity onPress={toggleShuffle}>
                        <Ionicons name="shuffle" size={24} color={isShuffleOn ? "#1DB8B5" : "rgba(255,255,255,0.6)"} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playPrevious}>
                        <Ionicons name="play-skip-back" size={36} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#0F1C1B" style={{ marginLeft: isPlaying ? 0 : 4 }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext}>
                        <Ionicons name="play-skip-forward" size={36} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleRepeat}>
                        <View>
                            <Ionicons name="repeat" size={24} color={repeatMode !== 'off' ? "#1DB8B5" : "rgba(255,255,255,0.6)"} />
                            {repeatMode === 'one' && (
                                <Text style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    color: '#1DB8B5',
                                    backgroundColor: '#0F1C1B',
                                    paddingHorizontal: 2,
                                    borderRadius: 4
                                }}>1</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowLyrics(!showLyrics)}>
                    <Ionicons name="text" size={24} color={showLyrics ? "#1DB8B5" : "#FFF"} />
                    <Text style={[styles.actionText, showLyrics && { color: "#1DB8B5" }]}>Lirik</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="list" size={24} color="#FFF" />
                    <Text style={styles.actionText}>Daftar</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1C1B',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    pattern: {
        position: 'absolute',
        top: -100,
        left: -100,
        opacity: 0.1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        zIndex: 10,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-around',
        paddingBottom: 20,
    },
    lyricsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    lyricItem: {
        marginBottom: 24,
    },
    ayahBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(29, 184, 181, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
    },
    ayahNumber: {
        color: '#1DB8B5',
        fontSize: 12,
        fontWeight: 'bold',
    },
    arabicText: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'System',
        textAlign: 'right',
        marginBottom: 8,
        lineHeight: 40,
    },
    translationText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
    },
    artworkContainer: {
        width: width - 80,
        height: width - 80,
        alignSelf: 'center',
        borderRadius: 32,
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    artwork: {
        flex: 1,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 30, // Increase top margin slightly
        paddingHorizontal: 24,
    },
    infoTextContainer: {
        alignItems: 'center',
        flex: 1,
    },
    surahName: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    qariName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        marginBottom: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    timeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingBottom: 20,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 40,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 6,
    },
});
