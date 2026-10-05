import { fetchSurahs, getAudioUrl, QARIS, Surah } from '@/services/quranApi';
import { ALL_SURAHS } from '@/constants/surahsData';
import { useDownload } from '@/context/DownloadContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Image, AppState } from 'react-native';
import { WidgetBridge } from '@/modules/widget-bridge';
import { notifySurahChanged } from '@/services/adMobService';
import { checkPremiumStatus } from '@/services/revenueCatService';

export interface TitleDetails {
    surahName: string;
    qariName: string;
    surahNumber: number;
    qariId: string;
    ayahNumber?: number;
}

export const AMBIENT_AUDIO_MAP: Record<string, any> = {
    rain: require('@/assets/audio/ambient/rain.mp3'),
    fire: require('@/assets/audio/ambient/fireplace.mp3'),
    birds: require('@/assets/audio/ambient/birds.mp3'),
    wind: require('@/assets/audio/ambient/wind.mp3'),
    waves: require('@/assets/audio/ambient/ocean.mp3'),
};

const INITIAL_SURAHS: Surah[] = ALL_SURAHS.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.meaning || s.englishName,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
}));

interface AudioContextType {
    sound: AudioPlayer | null;
    surahList: Surah[];
    isPlaying: boolean;
    isAutoPlayEnabled: boolean;
    currentTrack: TitleDetails | null;
    position: number;
    duration: number;
    sleepTimerActive: boolean;
    isShuffleOn: boolean;
    repeatMode: 'off' | 'all' | 'one';
    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;
    volume: number;
    setVolume: (volume: number) => void;
    selectedAmbient: string;
    setSelectedAmbient: (ambientId: string) => void;
    ambientVolume: number;
    setAmbientVolume: (volume: number) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    playSurah: (url: string, details: TitleDetails) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    toggleAutoPlay: () => Promise<void>;
    seekTo: (positionMillis: number) => Promise<void>;
    stop: () => Promise<void>;
    playNext: () => Promise<void>;
    playPrevious: () => Promise<void>;
    startSleepTimer: (minutes: number) => void;
    cancelSleepTimer: () => void;
}

const AudioContext = createContext<AudioContextType>({
    sound: null,
    surahList: INITIAL_SURAHS,
    isPlaying: false,
    isAutoPlayEnabled: true,
    currentTrack: null,
    position: 0,
    duration: 0,
    sleepTimerActive: false,
    isShuffleOn: false,
    repeatMode: 'off',
    playbackSpeed: 1.0,
    setPlaybackSpeed: () => { },
    volume: 1.0,
    setVolume: () => { },
    selectedAmbient: 'rain',
    setSelectedAmbient: () => { },
    ambientVolume: 0.35,
    setAmbientVolume: () => { },
    toggleShuffle: () => { },
    toggleRepeat: () => { },
    playSurah: async () => { },
    togglePlayPause: async () => { },
    toggleAutoPlay: async () => { },
    seekTo: async () => { },
    stop: async () => { },
    playNext: async () => { },
    playPrevious: async () => { },
    startSleepTimer: () => { },
    cancelSleepTimer: () => { },
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const player = useAudioPlayer(null, {
        updateInterval: 500,
        keepAudioSessionActive: true,
    });
    const status = useAudioPlayerStatus(player);
    const { getLocalAudioUri } = useDownload();

    const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<TitleDetails | null>(null);
    const [surahList, setSurahList] = useState<Surah[]>(INITIAL_SURAHS);

    // Playback Modes
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
    const [playbackSpeed, setPlaybackSpeedState] = useState(1.0);
    const [volume, setVolumeState] = useState(1.0);

    // Global Ambient Player & State (plays continuously even when player is minimized)
    const ambientPlayer = useAudioPlayer(null, {
        updateInterval: 1000,
        keepAudioSessionActive: true,
    });
    const [selectedAmbient, setSelectedAmbientState] = useState<string>('rain');
    const [ambientVolume, setAmbientVolumeState] = useState<number>(0.35);

    const selectedAmbientRef = useRef<string>('rain');
    const ambientVolumeRef = useRef<number>(0.35);

    // Sleep Timer State
    const [sleepTimerActive, setSleepTimerActive] = useState(false);
    const [sleepTimerId, setSleepTimerId] = useState<any>(null);

    // Refs to access latest state in callbacks without triggering re-creation of listener
    const autoPlayRef = useRef(isAutoPlayEnabled);
    const surahListRef = useRef(surahList);
    const currentTrackRef = useRef(currentTrack);
    const shuffleRef = useRef(isShuffleOn);
    const repeatRef = useRef(repeatMode);
    const playbackSpeedRef = useRef(playbackSpeed);
    const volumeRef = useRef(volume);
    const isAutoAdvancingRef = useRef(false);

    useEffect(() => { autoPlayRef.current = isAutoPlayEnabled; }, [isAutoPlayEnabled]);
    useEffect(() => { surahListRef.current = surahList; }, [surahList]);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
    useEffect(() => { shuffleRef.current = isShuffleOn; }, [isShuffleOn]);
    useEffect(() => { repeatRef.current = repeatMode; }, [repeatMode]);
    useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
    useEffect(() => { volumeRef.current = volume; }, [volume]);
    useEffect(() => { selectedAmbientRef.current = selectedAmbient; }, [selectedAmbient]);
    useEffect(() => { ambientVolumeRef.current = ambientVolume; }, [ambientVolume]);

    const setPlaybackSpeed = (speed: number) => {
        playbackSpeedRef.current = speed;
        setPlaybackSpeedState(speed);
        try {
            if (player && typeof (player as any).setPlaybackRate === 'function') {
                (player as any).setPlaybackRate(speed, 'high');
            }
        } catch (e) {
            console.log('Error setting playback rate:', e);
        }
    };

    const setVolume = (val: number) => {
        const clamped = Math.max(0, Math.min(1, val));
        volumeRef.current = clamped;
        setVolumeState(clamped);
        try {
            if (player) {
                player.volume = clamped;
            }
        } catch (e) {
            console.log('Error setting player volume:', e);
        }
        AsyncStorage.setItem('quran_volume', clamped.toString()).catch(() => { });
    };

    const setAmbientVolume = (val: number) => {
        const clamped = Math.max(0, Math.min(1, val));
        ambientVolumeRef.current = clamped;
        setAmbientVolumeState(clamped);
        try {
            if (ambientPlayer) {
                ambientPlayer.volume = clamped;
            }
        } catch (e) {
            console.log('Error setting ambient volume:', e);
        }
        AsyncStorage.setItem('ambient_volume', clamped.toString()).catch(() => { });
    };

    const setSelectedAmbient = async (soundId: string) => {
        selectedAmbientRef.current = soundId;
        setSelectedAmbientState(soundId);
        AsyncStorage.setItem('selected_ambient', soundId).catch(() => { });

        if (!ambientPlayer) return;
        if (soundId === 'none' || !AMBIENT_AUDIO_MAP[soundId]) {
            try {
                ambientPlayer.pause();
            } catch (_) { }
            return;
        }

        const audioAsset = AMBIENT_AUDIO_MAP[soundId];
        try {
            await Asset.loadAsync(audioAsset);
            ambientPlayer.replace(audioAsset);
            ambientPlayer.loop = true;
            ambientPlayer.volume = ambientVolumeRef.current;
            if (status.playing) {
                ambientPlayer.play();
            }
        } catch (e) {
            console.log('Error playing ambient sound in AudioContext:', e);
        }
    };

    // Enable audio playback in background with system Now Playing (Control Center, Lock Screen, Dynamic Island)
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'doNotMix', // REQUIRED by iOS for Dynamic Island, Lock Screen widget, and Control Center
            allowsRecording: false,
            shouldRouteThroughEarpiece: false,
        }).catch(err => console.error('Error setting audio mode:', err));

        // Re-assert audio mode when app enters background or returns to active to prevent other modules from resetting it
        const appStateSub = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                if (player && (player.playing || currentTrackRef.current)) {
                    setAudioModeAsync({
                        playsInSilentMode: true,
                        shouldPlayInBackground: true,
                        interruptionMode: 'doNotMix',
                        allowsRecording: false,
                        shouldRouteThroughEarpiece: false,
                    }).catch(() => { });
                }
            }
        });

        // Cache surah list from network, with safe fallback already initialized
        fetchSurahs().then(list => {
            if (list && list.length > 0) {
                setSurahList(list);
            }
        }).catch(err => {
            console.warn('Failed to fetch surahs list, using local fallback:', err);
        });

        // Load AutoPlay pref
        AsyncStorage.getItem('auto_play').then(val => {
            if (val !== null) setIsAutoPlayEnabled(val === 'true');
        });

        // Load Quran volume pref
        AsyncStorage.getItem('quran_volume').then(val => {
            if (val !== null) {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                    const clamped = Math.max(0, Math.min(1, parsed));
                    volumeRef.current = clamped;
                    setVolumeState(clamped);
                    try {
                        if (player) player.volume = clamped;
                    } catch (_) { }
                }
            }
        });

        // Load Ambient sound and volume pref
        Promise.all([
            AsyncStorage.getItem('selected_ambient'),
            AsyncStorage.getItem('ambient_volume'),
        ]).then(async ([savedAmbient, savedVolume]) => {
            if (savedVolume !== null) {
                const parsed = parseFloat(savedVolume);
                if (!isNaN(parsed)) {
                    const clamped = Math.max(0, Math.min(1, parsed));
                    ambientVolumeRef.current = clamped;
                    setAmbientVolumeState(clamped);
                    try {
                        if (ambientPlayer) ambientPlayer.volume = clamped;
                    } catch (_) { }
                }
            }
            const initialSoundId = savedAmbient || 'rain';
            selectedAmbientRef.current = initialSoundId;
            setSelectedAmbientState(initialSoundId);

            if (initialSoundId !== 'none' && AMBIENT_AUDIO_MAP[initialSoundId] && ambientPlayer) {
                const audioAsset = AMBIENT_AUDIO_MAP[initialSoundId];
                try {
                    await Asset.loadAsync(audioAsset);
                    ambientPlayer.replace(audioAsset);
                    ambientPlayer.loop = true;
                    ambientPlayer.volume = ambientVolumeRef.current;
                } catch (e) {
                    console.log('Error initializing ambient audio in AudioContext:', e);
                }
            }
        });

        return () => {
            appStateSub.remove();
        };
    }, [player]);

    // Global sync: ambient sound plays/pauses in sync with Quran recitation
    useEffect(() => {
        if (!ambientPlayer || selectedAmbientRef.current === 'none') return;
        try {
            if (status.playing) {
                ambientPlayer.loop = true;
                ambientPlayer.volume = ambientVolumeRef.current;
                ambientPlayer.play();
            } else {
                ambientPlayer.pause();
            }
        } catch (e) {
            console.log('Ambient sync error in AudioContext:', e);
        }
    }, [status.playing, ambientPlayer]);

    const startSleepTimer = (minutes: number) => {
        if (sleepTimerId) clearTimeout(sleepTimerId);
        setSleepTimerActive(true);

        const id = setTimeout(() => {
            player.pause();
            setSleepTimerActive(false);
            setSleepTimerId(null);
        }, minutes * 60 * 1000);

        setSleepTimerId(id);
    };

    const cancelSleepTimer = () => {
        if (sleepTimerId) clearTimeout(sleepTimerId);
        setSleepTimerActive(false);
        setSleepTimerId(null);
    };

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (sleepTimerId) clearTimeout(sleepTimerId);
        };
    }, [sleepTimerId]);

    const toggleShuffle = () => setIsShuffleOn(prev => !prev);

    const toggleRepeat = () => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    };

    // Core play method used both internally and externally
    const playSurahInternal = async (url: string, details: TitleDetails) => {
        try {
            // Check if downloaded locally for 100% offline playback (skip if playing a specific ayah from notification)
            const localUri = details.ayahNumber ? null : getLocalAudioUri(details.qariId, details.surahNumber);
            const playbackSource = localUri || url;

            player.replace(playbackSource);
            try {
                if (playbackSpeedRef.current !== 1.0 && player) {
                    if (typeof (player as any).setPlaybackRate === 'function') {
                        (player as any).setPlaybackRate(playbackSpeedRef.current, 'high');
                    }
                }
            } catch (e) { }

            try {
                if (player) {
                    player.volume = volumeRef.current;
                }
            } catch (e) { }

            player.play();

            // Safety check: ensure playback resumes when replacing tracks
            setTimeout(() => {
                try {
                    if (player && !player.playing) {
                        player.play();
                    }
                } catch (_) { }
            }, 300);

            const previousTrack = currentTrackRef.current;
            currentTrackRef.current = details;
            setCurrentTrack(details);

            // Resolve Qari artwork image for Dynamic Island, Lock Screen, and Control Center
            const currentQari = QARIS.find(q => q.id === details.qariId);
            let artworkUrl: string | undefined = undefined;
            if (currentQari?.image) {
                try {
                    const resolved = Image.resolveAssetSource(currentQari.image);
                    artworkUrl = resolved?.uri;
                } catch (_) { }
            }

            const formattedTitle = details.ayahNumber
                ? `${details.surahName} (Ayat ${details.ayahNumber})`
                : `${details.surahNumber}. ${details.surahName}`;

            // On iOS/Android, lock screen controls are important for background playback, Control Center, and Dynamic Island
            player.setActiveForLockScreen(true, {
                title: formattedTitle,
                artist: details.qariName,
                albumTitle: "Al-Qur'an Al-Karim",
                artworkUrl: artworkUrl,
            }, {
                showSeekForward: true,
                showSeekBackward: true,
            });

            // Sync with iOS Home Screen & Lock Screen Widget
            WidgetBridge.setWidgetData({
                surahName: details.surahName,
                surahNumber: details.surahNumber,
                qariName: details.qariName,
                isPlaying: true,
            });

            // Track surah change for AdMob Interstitial (every 2 surahs for non-premium users)
            if (!previousTrack || previousTrack.surahNumber !== details.surahNumber) {
                checkPremiumStatus().then(isPremium => {
                    notifySurahChanged(isPremium, {
                        onAdWillShow: () => {
                            console.log('[AudioContext] Interstitial ad showing (screen active), pausing audio...');
                            try {
                                player.pause();
                            } catch (_) { }
                        },
                        onAdDismissed: () => {
                            console.log('[AudioContext] Interstitial ad closed, resuming audio...');
                            try {
                                player.play();
                                WidgetBridge.setWidgetData({
                                    surahName: details.surahName,
                                    surahNumber: details.surahNumber,
                                    qariName: details.qariName,
                                    isPlaying: true,
                                });
                            } catch (_) { }
                        }
                    });
                }).catch(() => { });
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const playNext = useCallback(async () => {
        const track = currentTrackRef.current;
        const list = (surahListRef.current && surahListRef.current.length > 0) ? surahListRef.current : INITIAL_SURAHS;
        const shuffle = shuffleRef.current;
        const repeat = repeatRef.current;

        if (!track) return;

        let nextNum: number;

        if (repeat === 'one') {
            nextNum = track.surahNumber;
            await player.seekTo(0);
            player.play();
            return;
        }

        // Check if current qari has limited available surahs (e.g. partial recitations)
        const currentQari = QARIS.find(q => q.id === track.qariId);
        const availableSurahs = currentQari?.availableSurahs;

        if (availableSurahs && availableSurahs.length > 0) {
            if (shuffle) {
                const otherSurahs = availableSurahs.filter(n => n !== track.surahNumber);
                nextNum = otherSurahs.length > 0
                    ? otherSurahs[Math.floor(Math.random() * otherSurahs.length)]
                    : track.surahNumber;
            } else {
                const currentIndex = availableSurahs.indexOf(track.surahNumber);
                if (currentIndex >= 0 && currentIndex < availableSurahs.length - 1) {
                    nextNum = availableSurahs[currentIndex + 1];
                } else {
                    // Loop back to first available surah
                    nextNum = availableSurahs[0];
                }
            }
        } else {
            // Full 114 surahs
            if (shuffle) {
                nextNum = Math.floor(Math.random() * 114) + 1;
                if (nextNum === track.surahNumber && list.length > 1) {
                    nextNum = nextNum === 114 ? 1 : nextNum + 1;
                }
            } else {
                nextNum = track.surahNumber + 1;
                if (nextNum > 114) {
                    // Loop back to Surah 1 (Al-Fatihah)
                    nextNum = 1;
                }
            }
        }

        const nextSurah = list.find(s => s.number === nextNum) || ALL_SURAHS.find(s => s.number === nextNum);
        const surahName = nextSurah?.englishName || `Surah ${nextNum}`;
        const localUri = getLocalAudioUri(track.qariId, nextNum);
        const url = localUri || getAudioUrl(track.qariId, nextNum);

        await playSurahInternal(url, {
            surahName,
            qariName: track.qariName,
            surahNumber: nextNum,
            qariId: track.qariId
        });
    }, [player, getLocalAudioUri]);

    const playPrevious = useCallback(async () => {
        const track = currentTrackRef.current;
        const list = (surahListRef.current && surahListRef.current.length > 0) ? surahListRef.current : INITIAL_SURAHS;
        const repeat = repeatRef.current;

        if (!track) return;

        if (repeat === 'one') {
            await player.seekTo(0);
            player.play();
            return;
        }

        let prevNum: number;
        const currentQari = QARIS.find(q => q.id === track.qariId);
        const availableSurahs = currentQari?.availableSurahs;

        if (availableSurahs && availableSurahs.length > 0) {
            const currentIndex = availableSurahs.indexOf(track.surahNumber);
            if (currentIndex > 0) {
                prevNum = availableSurahs[currentIndex - 1];
            } else {
                prevNum = availableSurahs[availableSurahs.length - 1];
            }
        } else {
            prevNum = track.surahNumber - 1;
            if (prevNum < 1) {
                prevNum = 114;
            }
        }

        const prevSurah = list.find(s => s.number === prevNum) || ALL_SURAHS.find(s => s.number === prevNum);
        const surahName = prevSurah?.englishName || `Surah ${prevNum}`;
        const localUri = getLocalAudioUri(track.qariId, prevNum);
        const url = localUri || getAudioUrl(track.qariId, prevNum);

        await playSurahInternal(url, {
            surahName,
            qariName: track.qariName,
            surahNumber: prevNum,
            qariId: track.qariId
        });
    }, [player, getLocalAudioUri]);

    // Handles automatic advance to next surah when track finishes
    const handleAutoNext = useCallback(async () => {
        if (!autoPlayRef.current) return;
        if (isAutoAdvancingRef.current) return;
        if (!currentTrackRef.current) return;

        isAutoAdvancingRef.current = true;
        console.log('[AudioContext] Track finished, auto-advancing to next surah from:', currentTrackRef.current.surahName);

        try {
            await playNext();
        } catch (err) {
            console.error('[AudioContext] Error auto-playing next surah:', err);
        } finally {
            // Lock window to prevent double advancing while new track prepares
            setTimeout(() => {
                isAutoAdvancingRef.current = false;
            }, 1200);
        }
    }, [playNext]);

    // 1. Direct native event listener on player for immediate auto-advance
    useEffect(() => {
        if (!player) return;

        const subscription = (player as any).addListener?.('playbackStatusUpdate', (statusUpdate: any) => {
            if (!statusUpdate) return;

            // Condition 1: didJustFinish emitted by native player
            if (statusUpdate.didJustFinish) {
                handleAutoNext();
                return;
            }

            // Condition 2: Fallback when audio reaches EOF and playback stops
            if (
                statusUpdate.duration > 1 &&
                statusUpdate.currentTime > 0 &&
                statusUpdate.currentTime >= statusUpdate.duration - 0.75 &&
                !statusUpdate.playing &&
                !statusUpdate.isBuffering
            ) {
                handleAutoNext();
            }
        });

        return () => {
            subscription?.remove?.();
        };
    }, [player, handleAutoNext]);

    // 2. React state observer fallback
    useEffect(() => {
        if (status.didJustFinish) {
            handleAutoNext();
        } else if (
            status.duration > 1 &&
            status.currentTime > 0 &&
            status.currentTime >= status.duration - 0.75 &&
            !status.playing &&
            !status.isBuffering
        ) {
            handleAutoNext();
        }
    }, [status.didJustFinish, status.currentTime, status.duration, status.playing, status.isBuffering, handleAutoNext]);

    // Public exposed function
    const playSurah = async (url: string, details: TitleDetails) => {
        await playSurahInternal(url, details);
    };

    const toggleAutoPlay = async () => {
        const newValue = !isAutoPlayEnabled;
        setIsAutoPlayEnabled(newValue);
        await AsyncStorage.setItem('auto_play', String(newValue));
    };

    const togglePlayPause = async () => {
        if (player.playing) {
            player.pause();
            if (currentTrack) {
                WidgetBridge.setWidgetData({
                    surahName: currentTrack.surahName,
                    surahNumber: currentTrack.surahNumber,
                    qariName: currentTrack.qariName,
                    isPlaying: false,
                });
            }
        } else {
            player.play();
            if (currentTrack) {
                WidgetBridge.setWidgetData({
                    surahName: currentTrack.surahName,
                    surahNumber: currentTrack.surahNumber,
                    qariName: currentTrack.qariName,
                    isPlaying: true,
                });
            }
        }
    };

    const seekTo = async (positionMillis: number) => {
        await player.seekTo(positionMillis / 1000);
    };

    const stop = async () => {
        player.pause();
        await player.seekTo(0);
        player.clearLockScreenControls();
        try {
            if (ambientPlayer) ambientPlayer.pause();
        } catch (_) { }
        if (currentTrack) {
            WidgetBridge.setWidgetData({
                surahName: currentTrack.surahName,
                surahNumber: currentTrack.surahNumber,
                qariName: currentTrack.qariName,
                isPlaying: false,
            });
        }
    };

    return (
        <AudioContext.Provider value={{
            sound: player,
            surahList,
            isPlaying: status.playing,
            isAutoPlayEnabled,
            currentTrack,
            position: status.currentTime * 1000,
            duration: status.duration * 1000,
            sleepTimerActive,
            isShuffleOn,
            repeatMode,
            playbackSpeed,
            setPlaybackSpeed,
            volume,
            setVolume,
            selectedAmbient,
            setSelectedAmbient,
            ambientVolume,
            setAmbientVolume,
            toggleShuffle,
            toggleRepeat,
            playSurah,
            togglePlayPause,
            toggleAutoPlay,
            seekTo,
            stop,
            playNext,
            playPrevious,
            startSleepTimer,
            cancelSleepTimer
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => useContext(AudioContext);
