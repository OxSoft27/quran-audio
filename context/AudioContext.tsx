import { fetchSurahs, getAudioUrl, Surah } from '@/services/quranApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface TitleDetails {
    surahName: string;
    qariName: string;
    surahNumber: number;
    qariId: string;
}

// ... imports

interface AudioContextType {
    sound: Audio.Sound | null;
    surahList: Surah[];
    isPlaying: boolean;
    isAutoPlayEnabled: boolean;
    currentTrack: TitleDetails | null;
    position: number;
    duration: number;
    sleepTimerActive: boolean;
    isShuffleOn: boolean;
    repeatMode: 'off' | 'all' | 'one';
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
    surahList: [],
    isPlaying: false,
    isAutoPlayEnabled: true,
    currentTrack: null,
    position: 0,
    duration: 0,
    sleepTimerActive: false,
    isShuffleOn: false,
    repeatMode: 'off',
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
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<TitleDetails | null>(null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [surahList, setSurahList] = useState<Surah[]>([]);

    // Playback Modes
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

    // Sleep Timer State
    const [sleepTimerActive, setSleepTimerActive] = useState(false);
    const [sleepTimerId, setSleepTimerId] = useState<any>(null);

    // Refs to access latest state in callbacks without triggering re-creation of listener
    const autoPlayRef = useRef(isAutoPlayEnabled);
    const surahListRef = useRef(surahList);
    const currentTrackRef = useRef(currentTrack);
    const soundRef = useRef(sound);
    const shuffleRef = useRef(isShuffleOn);
    const repeatRef = useRef(repeatMode);

    useEffect(() => { autoPlayRef.current = isAutoPlayEnabled; }, [isAutoPlayEnabled]);
    useEffect(() => { surahListRef.current = surahList; }, [surahList]);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
    useEffect(() => { soundRef.current = sound; }, [sound]);
    useEffect(() => { shuffleRef.current = isShuffleOn; }, [isShuffleOn]);
    useEffect(() => { repeatRef.current = repeatMode; }, [repeatMode]);

    // Enable audio playback
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        // Cache surah list
        fetchSurahs().then(setSurahList);

        // Load AutoPlay pref
        AsyncStorage.getItem('auto_play').then(val => {
            if (val !== null) setIsAutoPlayEnabled(val === 'true');
        });
    }, []);

    const startSleepTimer = (minutes: number) => {
        if (sleepTimerId) clearTimeout(sleepTimerId);
        setSleepTimerActive(true);

        const id = setTimeout(async () => {
            if (soundRef.current) {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            }
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

    const playNext = useCallback(async () => {
        const track = currentTrackRef.current;
        const list = surahListRef.current;
        const shuffle = shuffleRef.current;
        const repeat = repeatRef.current;

        if (!track || list.length === 0) return;

        let nextNum: number;

        if (repeat === 'one') {
            nextNum = track.surahNumber;
            // If repeat one, we just replay the current one.
            await seekTo(0); // If it's already playing, this might be enough, but context calls playSurah.
            // To be consistent with auto-next, we'll reload it.
        } else if (shuffle) {
            // Random 1-114
            nextNum = Math.floor(Math.random() * 114) + 1;
            // Avoid repeating same song in shuffle if possible (unless only 1 exists)
            if (nextNum === track.surahNumber && list.length > 1) {
                nextNum = nextNum === 114 ? 1 : nextNum + 1;
            }
        } else {
            // Linear
            nextNum = track.surahNumber + 1;
            if (nextNum > 114) {
                if (repeat === 'all') {
                    nextNum = 1;
                } else {
                    return; // End of playlist
                }
            }
        }

        const nextSurah = list.find(s => s.number === nextNum);
        if (nextSurah) {
            const url = getAudioUrl(track.qariId, nextNum);
            await playSurahInternal(url, {
                surahName: nextSurah.englishName,
                qariName: track.qariName,
                surahNumber: nextNum,
                qariId: track.qariId
            });
        }
    }, []);

    const playPrevious = useCallback(async () => {
        const track = currentTrackRef.current;
        const list = surahListRef.current;
        const repeat = repeatRef.current;

        if (!track || list.length === 0) return;

        // For Previous, usually we just go previous linearly, ignoring shuffle, unless repeat one
        let prevNum = track.surahNumber - 1;

        if (prevNum < 1) {
            if (repeat === 'all') {
                prevNum = 114;
            } else {
                return;
            }
        }

        const prevSurah = list.find(s => s.number === prevNum);
        if (prevSurah) {
            const url = getAudioUrl(track.qariId, prevNum);
            await playSurahInternal(url, {
                surahName: prevSurah.englishName,
                qariName: track.qariName,
                surahNumber: prevNum,
                qariId: track.qariId
            });
        }
    }, []);

    const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                setIsPlaying(false);
                if (autoPlayRef.current) {
                    await playNext();
                }
            }
        }
    };

    // Define playSurah separately to be used internally
    const playSurahInternal = async (url: string, details: TitleDetails) => {
        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            // Create new sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            // Set the update listener.
            newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

            setSound(newSound);
            setCurrentTrack(details);
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

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
        if (sound) {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
        }
    };

    const seekTo = async (positionMillis: number) => {
        if (sound) {
            await sound.setPositionAsync(positionMillis);
        }
    };

    const stop = async () => {
        if (sound) {
            await sound.stopAsync();
        }
    };

    // Clean up
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    return (
        <AudioContext.Provider value={{
            sound,
            surahList,
            isPlaying,
            isAutoPlayEnabled,
            currentTrack,
            position,
            duration,
            sleepTimerActive,
            isShuffleOn,
            repeatMode,
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
