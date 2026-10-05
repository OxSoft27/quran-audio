import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { QARIS, Qari } from '@/services/quranApi';

interface ManageFavoriteQarisModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectQari?: (qari: Qari) => void;
}

const QARI_IMAGES: Record<string, any> = {
    'mishary': require('@/assets/images/qaris/mishary.png'),
    'abdulbasit': require('@/assets/images/qaris/abdulbasit.png'),
    'saad': require('@/assets/images/qaris/saad.png'),
    'maher': require('@/assets/images/qaris/maher.png'),
};

export const ManageFavoriteQarisModal: React.FC<ManageFavoriteQarisModalProps> = ({
    visible,
    onClose,
    onSelectQari,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { favoriteQaris, toggleFavoriteQari } = useFavorites();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: Colors[theme].border }]}>
                    <View>
                        <Text style={[styles.title, { color: Colors[theme].text }]}>
                            Kelola Qari Favorit
                        </Text>
                        <Text style={[styles.subtitle, { color: Colors[theme].subtitle }]}>
                            Pilih qari favorit untuk beranda Anda
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.doneButton, { backgroundColor: Colors[theme].tint }]}
                    >
                        <Text style={styles.doneButtonText}>Selesai</Text>
                    </TouchableOpacity>
                </View>

                {/* List of Qaris */}
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {QARIS.map((qari) => {
                        const isFav = favoriteQaris.includes(qari.id);
                        const imageSource = qari.image || QARI_IMAGES[qari.id] || QARI_IMAGES['mishary'];

                        return (
                            <TouchableOpacity
                                key={qari.id}
                                style={[
                                    styles.qariRow,
                                    {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                        borderColor: isFav ? Colors[theme].tint : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                                        borderWidth: isFav ? 2 : 1,
                                    }
                                ]}
                                onPress={() => {
                                    toggleFavoriteQari(qari.id);
                                    if (onSelectQari) {
                                        onSelectQari(qari);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.qariLeft}>
                                    <View style={styles.avatarContainer}>
                                        <Image
                                            source={imageSource}
                                            style={styles.avatar}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <View style={styles.nameContainer}>
                                        <Text style={[styles.qariName, { color: Colors[theme].text }]}>
                                            {qari.name}
                                        </Text>
                                        <Text style={[styles.qariSubtext, { color: Colors[theme].subtitle }]}>
                                            {isFav ? 'Favorit aktif' : 'Ketuk untuk memfavoritkan'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: isFav ? Colors[theme].tint : 'transparent',
                                        borderColor: isFav ? Colors[theme].tint : Colors[theme].subtitle,
                                    }
                                ]}>
                                    {isFav && <Ionicons name="checkmark" size={16} color="#000000" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: {
        fontSize: Typography.size.title2,
        fontWeight: Typography.weight.bold,
    },
    subtitle: {
        fontSize: Typography.size.caption1,
        marginTop: Spacing.xs,
    },
    doneButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
    },
    doneButtonText: {
        color: '#000000',
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.bold,
    },
    listContent: {
        padding: Spacing.pagePadding,
        paddingBottom: Spacing['8xl'],
    },
    qariRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Spacing.lg,
        marginBottom: Spacing.md,
    },
    qariLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: '#2A2A2A',
        marginRight: Spacing.md,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    nameContainer: {
        flex: 1,
    },
    qariName: {
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.semibold,
    },
    qariSubtext: {
        fontSize: Typography.size.caption2,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
});
