import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlaylistScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { playlists, createPlaylist } = usePlaylist();

    const handleCreatePlaylist = () => {
        Alert.prompt(
            "Buat Playlist Baru",
            "Masukkan nama playlist",
            [
                { text: "Batal", style: 'cancel' },
                {
                    text: "Buat",
                    onPress: (text?: string) => {
                        if (text) {
                            createPlaylist(text);
                        }
                    }
                }
            ],
            "plain-text"
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Stack.Screen options={{
                title: 'Playlist',
                headerShown: true,
                headerStyle: { backgroundColor: Colors[theme].background },
                headerTitleStyle: { color: Colors[theme].text },
                headerTintColor: Colors[theme].tint,
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[
                            styles.backButton,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={Colors[theme].tint}
                            style={{ marginRight: 1.5 }}
                        />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={handleCreatePlaylist}>
                        <Ionicons name="add" size={28} color={Colors[theme].tint} />
                    </TouchableOpacity>
                ),
            }} />

            <View style={styles.content}>
                {playlists.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={64} color={Colors[theme].subtitle} />
                        <Text style={[styles.emptyText, { color: Colors[theme].subtitle }]}>Belum ada playlist</Text>
                    </View>
                ) : (
                    <FlatList
                        data={playlists}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: Spacing.pagePadding }}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.item, { backgroundColor: Colors[theme].card }]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="list" size={24} color={Colors[theme].tint} />
                                </View>
                                <View style={styles.info}>
                                    <Text style={[styles.name, { color: Colors[theme].text }]}>{item.name}</Text>
                                    <Text style={[styles.count, { color: Colors[theme].subtitle }]}>{item.surahs.length} Surah</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Colors[theme].subtitle} />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    },
    emptyText: {
        marginTop: Spacing.lg,
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.medium,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: Spacing.lg,
    },
    iconContainer: {
        width: Spacing['4xl'],
        height: Spacing['4xl'],
        borderRadius: Spacing.md,
        backgroundColor: 'rgba(29, 184, 181, 0.1)', // Tint with opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.semibold,
        marginBottom: Spacing.xs,
    },
    count: {
        fontSize: Typography.size.footnote,
    },
});
