import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Qari } from '@/services/quranApi';

interface QariAvatarProps {
    qari: Qari;
    isSelected?: boolean;
    onPress: (qari: Qari) => void;
}

const QARI_IMAGES: Record<string, any> = {
    'mishary': require('@/assets/images/reciter_1.png'),
    'abdulbasit': require('@/assets/images/reciter_2.png'),
    'saad': require('@/assets/images/reciter_3.png'),
    'maher': require('@/assets/images/reciter_4.png'),
};

export const QariAvatar: React.FC<QariAvatarProps> = ({ qari, isSelected, onPress }) => {
    const { theme } = useTheme();
    const imageSource = QARI_IMAGES[qari.id] || QARI_IMAGES['mishary'];

    return (
        <TouchableOpacity onPress={() => onPress(qari)} style={styles.container}>
            <View style={[
                styles.avatarContainer,
                isSelected && { borderColor: Colors[theme].tint, borderWidth: 2 }
            ]}>
                <Image
                    source={imageSource}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
            <Text style={[styles.name, { color: Colors[theme].text }]} numberOfLines={2}>
                {qari.name}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 80,
        marginRight: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 8,
        // Soft shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        backgroundColor: '#F0F0F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 16,
    },
});
