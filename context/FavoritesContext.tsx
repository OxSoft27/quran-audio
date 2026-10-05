import { Surah } from '@/services/quranApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const DEFAULT_FAVORITE_QARIS = [
    'abdul_rashid_sufi',
    'okasha_kameny',
    'abdulbasit_qobilov',
    'abdullah_buayjaan',
];

interface FavoritesContextType {
    favorites: Surah[];
    isFavorite: (surahNumber: number) => boolean;
    toggleFavorite: (surah: Surah) => Promise<void>;
    favoriteQaris: string[];
    isFavoriteQari: (qariId: string) => boolean;
    toggleFavoriteQari: (qariId: string) => Promise<void>;
    setFavoriteQaris: (qariIds: string[]) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: async () => { },
    favoriteQaris: DEFAULT_FAVORITE_QARIS,
    isFavoriteQari: () => false,
    toggleFavoriteQari: async () => { },
    setFavoriteQaris: async () => { },
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Surah[]>([]);
    const [favoriteQaris, setFavoriteQarisState] = useState<string[]>(DEFAULT_FAVORITE_QARIS);

    useEffect(() => {
        loadFavorites();
        loadFavoriteQaris();
    }, []);

    const loadFavorites = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@favorites');
            if (jsonValue != null) {
                setFavorites(JSON.parse(jsonValue));
            }
        } catch (e) {
            console.error("Failed to load favorites", e);
        }
    };

    const loadFavoriteQaris = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@favorite_qaris');
            if (jsonValue != null) {
                const parsed = JSON.parse(jsonValue);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFavoriteQarisState(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load favorite qaris", e);
        }
    };

    const isFavorite = (surahNumber: number) => {
        return favorites.some(s => s.number === surahNumber);
    };

    const toggleFavorite = async (surah: Surah) => {
        let newFavorites;
        if (isFavorite(surah.number)) {
            newFavorites = favorites.filter(s => s.number !== surah.number);
        } else {
            newFavorites = [...favorites, surah];
        }
        setFavorites(newFavorites);
        try {
            await AsyncStorage.setItem('@favorites', JSON.stringify(newFavorites));
        } catch (e) {
            console.error("Failed to save favorites", e);
        }
    };

    const isFavoriteQari = (qariId: string) => {
        return favoriteQaris.includes(qariId);
    };

    const toggleFavoriteQari = async (qariId: string) => {
        let newQaris: string[];
        if (favoriteQaris.includes(qariId)) {
            newQaris = favoriteQaris.filter(id => id !== qariId);
        } else {
            newQaris = [...favoriteQaris, qariId];
        }
        setFavoriteQarisState(newQaris);
        try {
            await AsyncStorage.setItem('@favorite_qaris', JSON.stringify(newQaris));
        } catch (e) {
            console.error("Failed to save favorite qaris", e);
        }
    };

    const setFavoriteQaris = async (qariIds: string[]) => {
        setFavoriteQarisState(qariIds);
        try {
            await AsyncStorage.setItem('@favorite_qaris', JSON.stringify(qariIds));
        } catch (e) {
            console.error("Failed to save favorite qaris", e);
        }
    };

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                isFavorite,
                toggleFavorite,
                favoriteQaris,
                isFavoriteQari,
                toggleFavoriteQari,
                setFavoriteQaris,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);

