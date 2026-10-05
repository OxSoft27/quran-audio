import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
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
            <Text
                style={[styles.title, { color: Colors[theme].text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {title}
            </Text>
            {onPressMore && (
                <TouchableOpacity
                    onPress={onPressMore}
                    style={styles.moreButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text
                        style={[styles.moreText, { color: Colors[theme].tint }]}
                        numberOfLines={1}
                    >
                        Lihat Semua
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={13}
                        color={Colors[theme].tint}
                        style={{ marginLeft: 2 }}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.pagePadding,
        marginTop: Spacing.lg,
        gap: 12,
    },
    title: {
        flex: 1,
        flexShrink: 1,
        fontSize: Typography.size.title3,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        letterSpacing: Typography.tracking.display,
    },
    moreButton: {
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    moreText: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: -0.1,
    },
});
