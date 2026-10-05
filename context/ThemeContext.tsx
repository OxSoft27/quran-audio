import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: 'light' | 'dark';
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    mode: 'system',
    setMode: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = _useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem('theme_mode').then((savedMode) => {
            if (savedMode) {
                setModeState(savedMode as ThemeMode);
            }
        });
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem('theme_mode', newMode);
    };

    const theme: 'light' | 'dark' = mode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : mode;

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
