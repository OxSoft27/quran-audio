import { Surah } from '@/services/quranApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface FavoritesContextType {
    favorites: Surah[];
    isFavorite: (surahNumber: number) => boolean;
    toggleFavorite: (surah: Surah) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: async () => { },
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Surah[]>([]);

    useEffect(() => {
        loadFavorites();
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

    return (
        <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
