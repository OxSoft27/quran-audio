import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    SafeAreaView,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { QARIS, Qari } from '@/services/quranApi';
import { QariSurahsModal } from '@/components/QariSurahsModal';
import { MiniPlayer } from '@/components/MiniPlayer';
import { Spacing } from '@/constants/Spacing';

interface CategoryOption {
    key: string;
    label: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
    { key: 'all', label: 'Semua Qari' },
    { key: 'popular', label: 'Populer' },
    { key: 'haramain', label: 'Imam Al-Haramain' },
    { key: 'egypt', label: 'Maestro Mesir' },
    { key: 'saudi', label: 'Arab Saudi' },
    { key: 'international', label: 'Internasional' },
];

export default function AllQarisScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const params = useLocalSearchParams<{ category?: string; title?: string }>();

    // Initial category based on params
    const initialCategory = params.category || 'all';
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedQari, setSelectedQari] = useState<Qari | null>(null);

    // Filter by category
    const categoryQaris = useMemo(() => {
        switch (selectedCategory) {
            case 'popular':
                return QARIS.filter((q) => q.isPopular);
            case 'haramain':
                return QARIS.filter((q) =>
                    q.specialty?.some((s) => s.toLowerCase().includes('masjid') || s.toLowerCase().includes('imam'))
                );
            case 'egypt':
                return QARIS.filter((q) => q.country === 'Mesir');
            case 'saudi':
                return QARIS.filter((q) => q.country === 'Arab Saudi');
            case 'international':
                return QARIS.filter((q) => q.country !== 'Arab Saudi' && q.country !== 'Mesir');
            case 'tajwid':
                return QARIS.filter((q) => q.specialty?.some((s) => s.toLowerCase().includes('tajwid')));
            case 'new':
                const NEW_QARI_IDS = ['ali_hudhaify', 'ahmed_kaseb', 'khalil_al_saghir'];
                return QARIS.filter((q) => NEW_QARI_IDS.includes(q.id));
            case 'all':
            default:
                return QARIS;
        }
    }, [selectedCategory]);

    // Filter by search query
    const filteredQaris = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return categoryQaris;
        return categoryQaris.filter(
            (q) =>
                q.name.toLowerCase().includes(query) ||
                q.country?.toLowerCase().includes(query) ||
                q.specialty?.some((s) => s.toLowerCase().includes(query))
        );
    }, [categoryQaris, searchQuery]);

    // Dynamic page title
    const currentTitle = useMemo(() => {
        if (params.title && selectedCategory === initialCategory) {
            return params.title;
        }
        const option = CATEGORY_OPTIONS.find((c) => c.key === selectedCategory);
        return option ? option.label : 'Daftar Qari';
    }, [selectedCategory, params.title, initialCategory]);

    const handleSelectQari = (qari: Qari) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedQari(qari);
    };

    const handleCategoryChange = (key: string) => {
        Haptics.selectionAsync();
        setSelectedCategory(key);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F4F4F5' }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[
                        styles.backButton,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                    ]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#111827'}
                    />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                        {currentTitle}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7280' }]}>
                        {filteredQaris.length} Qari Tersedia
                    </Text>
                </View>

                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Category Selector Chips */}
            <View style={styles.categoryScrollContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORY_OPTIONS}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={styles.categoryList}
                    renderItem={({ item }) => {
                        const isSelected = selectedCategory === item.key;
                        return (
                            <TouchableOpacity
                                onPress={() => handleCategoryChange(item.key)}
                                style={[
                                    styles.categoryChip,
                                    isSelected
                                        ? styles.categoryChipActive
                                        : [
                                              styles.categoryChipInactive,
                                              {
                                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                              },
                                          ],
                                ]}
                                activeOpacity={0.75}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        isSelected
                                            ? styles.categoryChipTextActive
                                            : {
                                                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#4B5563',
                                              },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
                <View
                    style={[
                        styles.searchBar,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            shadowColor: '#000000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDark ? 0 : 0.05,
                            shadowRadius: 6,
                            elevation: isDark ? 0 : 2,
                        },
                    ]}
                >
                    <Ionicons
                        name="search"
                        size={18}
                        color={isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)'}
                        style={{ marginRight: 8 }}
                    />
                    <TextInput
                        style={[
                            styles.searchInput,
                            { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                        placeholder={`Cari dalam ${currentTitle}...`}
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* List of Qaris */}
            {filteredQaris.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="search-outline"
                        size={48}
                        color={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                    />
                    <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Qari tidak ditemukan
                    </Text>
                    <Text
                        style={[
                            styles.emptySubtitle,
                            { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                        ]}
                    >
                        Coba kata kunci pencarian lain atau pilih kategori berbeda
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredQaris}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const surahCount = item.availableSurahs ? item.availableSurahs.length : 114;
                        const mainSpecialty = item.specialty && item.specialty.length > 0 ? item.specialty[0] : null;

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.qariCard,
                                    {
                                        backgroundColor: isDark ? '#141416' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                        shadowColor: '#000000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: isDark ? 0.3 : 0.06,
                                        shadowRadius: 8,
                                        elevation: isDark ? 1 : 2,
                                    },
                                ]}
                                onPress={() => handleSelectQari(item)}
                                activeOpacity={0.78}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={styles.avatarWrapper}>
                                        {item.image ? (
                                            <Image source={item.image} style={styles.avatarImage} />
                                        ) : (
                                            <View
                                                style={[
                                                    styles.avatarPlaceholder,
                                                    { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.avatarText,
                                                        { color: isDark ? '#FFFFFF' : '#18181B' },
                                                    ]}
                                                >
                                                    {item.name.charAt(0)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.infoWrapper}>
                                        <Text
                                            style={[styles.qariName, { color: isDark ? '#FFFFFF' : '#111827' }]}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </Text>

                                        <View style={styles.badgesRow}>
                                            {item.country && (
                                                <View
                                                    style={[
                                                        styles.countryBadge,
                                                        {
                                                            backgroundColor: isDark
                                                                ? 'rgba(29, 184, 181, 0.15)'
                                                                : 'rgba(29, 184, 181, 0.12)',
                                                        },
                                                    ]}
                                                >
                                                    <Text style={styles.countryBadgeText}>
                                                        {item.country}
                                                    </Text>
                                                </View>
                                            )}

                                            <View
                                                style={[
                                                    styles.surahCountBadge,
                                                    {
                                                        backgroundColor: isDark
                                                            ? 'rgba(255, 255, 255, 0.06)'
                                                            : 'rgba(0, 0, 0, 0.05)',
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.surahCountBadgeText,
                                                        {
                                                            color: isDark
                                                                ? 'rgba(255, 255, 255, 0.65)'
                                                                : '#6B7280',
                                                        },
                                                    ]}
                                                >
                                                    {surahCount} Surah
                                                </Text>
                                            </View>
                                        </View>

                                        {mainSpecialty && (
                                            <Text
                                                style={[
                                                    styles.specialtyText,
                                                    {
                                                        color: isDark
                                                            ? 'rgba(255, 255, 255, 0.45)'
                                                            : '#9CA3AF',
                                                    },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {mainSpecialty}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.cardRight}>
                                    <View
                                        style={[
                                            styles.playIconBadge,
                                            {
                                                backgroundColor: isDark
                                                    ? 'rgba(29, 184, 181, 0.15)'
                                                    : 'rgba(29, 184, 181, 0.1)',
                                            },
                                        ]}
                                    >
                                        <Ionicons name="play" size={16} color="#1DB8B5" style={{ marginLeft: 2 }} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* Persistent MiniPlayer when audio is playing */}
            <MiniPlayer hasTabBar={false} />

            {/* Modal surah qari */}
            <QariSurahsModal
                visible={!!selectedQari}
                qari={selectedQari}
                onClose={() => setSelectedQari(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Platform.OS === 'android' ? 14 : 6,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    headerRightPlaceholder: {
        width: 40,
    },
    categoryScrollContainer: {
        marginBottom: 8,
    },
    categoryList: {
        paddingHorizontal: Spacing.pagePadding,
        paddingVertical: 6,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#1DB8B5',
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    categoryChipInactive: {
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 0,
    },
    listContent: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 120,
        gap: 12,
    },
    qariCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
    },
    cardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#1DB8B5',
        marginRight: 14,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '700',
    },
    infoWrapper: {
        flex: 1,
    },
    qariName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    countryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    countryBadgeText: {
        color: '#1DB8B5',
        fontSize: 11,
        fontWeight: '700',
    },
    surahCountBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    surahCountBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    specialtyText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    cardRight: {
        marginLeft: 10,
    },
    playIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
});
