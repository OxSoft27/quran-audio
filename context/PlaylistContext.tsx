import { Surah } from '@/services/quranApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Playlist {
    id: string;
    name: string;
    surahs: Surah[];
}

interface PlaylistContextType {
    playlists: Playlist[];
    createPlaylist: (name: string) => Promise<void>;
    addToPlaylist: (playlistId: string, surah: Surah) => Promise<void>;
    removeFromPlaylist: (playlistId: string, surahNumber: number) => Promise<void>;
    deletePlaylist: (playlistId: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType>({
    playlists: [],
    createPlaylist: async () => { },
    addToPlaylist: async () => { },
    removeFromPlaylist: async () => { },
    deletePlaylist: async () => { },
});

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@playlists');
            if (jsonValue != null) {
                setPlaylists(JSON.parse(jsonValue));
            } else {
                // Initialize with some default/dummy if empty, or just empty
                setPlaylists([]);
            }
        } catch (e) {
            console.error("Failed to load playlists", e);
        }
    };

    const savePlaylists = async (newPlaylists: Playlist[]) => {
        setPlaylists(newPlaylists);
        try {
            await AsyncStorage.setItem('@playlists', JSON.stringify(newPlaylists));
        } catch (e) {
            console.error("Failed to save playlists", e);
        }
    };

    const createPlaylist = async (name: string) => {
        const newPlaylist: Playlist = {
            id: Date.now().toString(),
            name,
            surahs: []
        };
        await savePlaylists([...playlists, newPlaylist]);
    };

    const addToPlaylist = async (playlistId: string, surah: Surah) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                // Check if already exists
                if (p.surahs.some(s => s.number === surah.number)) return p;
                return { ...p, surahs: [...p.surahs, surah] };
            }
            return p;
        });
        await savePlaylists(updatedPlaylists);
    };

    const removeFromPlaylist = async (playlistId: string, surahNumber: number) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                return { ...p, surahs: p.surahs.filter(s => s.number !== surahNumber) };
            }
            return p;
        });
        await savePlaylists(updatedPlaylists);
    };

    const deletePlaylist = async (playlistId: string) => {
        const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
        await savePlaylists(updatedPlaylists);
    };

    return (
        <PlaylistContext.Provider value={{ playlists, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist }}>
            {children}
        </PlaylistContext.Provider>
    );
};

export const usePlaylist = () => useContext(PlaylistContext);
