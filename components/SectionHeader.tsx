import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
    title: string;
    onPressMore?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onPressMore }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: Colors[theme].text }]}>{title}</Text>
            {onPressMore && (
                <TouchableOpacity onPress={onPressMore}>
                    <Text style={[styles.moreText, { color: Colors[theme].tint }]}>Lihat Semua</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        marginTop: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'System',
    },
    moreText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
