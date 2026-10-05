import { QariAvatar } from '@/components/QariAvatar';
import { QariSurahsModal } from '@/components/QariSurahsModal';
import { SectionHeader } from '@/components/SectionHeader';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAudio } from '@/context/AudioContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { useTheme } from '@/context/ThemeContext';
import { QARIS, Qari } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function QariScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { playSurah } = useAudio();
    const { scrollHandler } = useTabBarAnimation();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedQari, setSelectedQari] = useState<Qari | null>(null);

    const query = searchQuery.trim().toLowerCase();

    const filterQaris = (list: Qari[]) => {
        if (!query) return list;
        return list.filter((q) => q.name.toLowerCase().includes(query));
    };

    // Grouping by meaningful Islamic categories
    const popularQaris = filterQaris(QARIS.filter((q) => q.isPopular));
    const haramainQaris = filterQaris(QARIS.filter((q) => q.specialty?.some((s) => s.toLowerCase().includes('masjid') || s.toLowerCase().includes('imam'))));
    const egyptQaris = filterQaris(QARIS.filter((q) => q.country === 'Mesir'));
    const saudiQaris = filterQaris(QARIS.filter((q) => q.country === 'Arab Saudi'));
    const internationalQaris = filterQaris(QARIS.filter((q) => q.country !== 'Arab Saudi' && q.country !== 'Mesir'));

    const totalResults = popularQaris.length + haramainQaris.length + egyptQaris.length + saudiQaris.length + internationalQaris.length;

    const handleSelectQari = (qari: Qari) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedQari(qari);
    };

    const handleSeeAll = (category: string, title: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/all-qaris',
            params: { category, title },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F4F4F5' }]}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {t('tabs.qari', 'Qari')}
                    </Text>
                </View>

                {/* Search Bar */}
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
                            placeholder={t('qari.searchPlaceholder', 'Cari qari')}
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

                {/* Empty State when Search Yields Nothing */}
                {query.length > 0 && totalResults === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="search-outline"
                            size={44}
                            color={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}
                        />
                        <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            Qari tidak ditemukan
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>
                            Coba kata kunci lain atau periksa ejaan nama qari
                        </Text>
                    </View>
                )}

                {/* Popular Reciters This Month */}
                {popularQaris.length > 0 && (
                    <View style={styles.sectionWrapper}>
                        <SectionHeader
                            title="Qari Populer Bulan Ini"
                            onPressMore={() => handleSeeAll('popular', 'Qari Populer Bulan Ini')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                            {popularQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    onPress={handleSelectQari}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Imam Al-Haramain */}
                {haramainQaris.length > 0 && (
                    <View style={styles.sectionWrapper}>
                        <SectionHeader
                            title="Imam Al-Haramain"
                            onPressMore={() => handleSeeAll('haramain', 'Imam Al-Haramain')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                            {haramainQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    onPress={handleSelectQari}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Maestro & Legenda Mesir */}
                {egyptQaris.length > 0 && (
                    <View style={styles.sectionWrapper}>
                        <SectionHeader
                            title="Maestro & Legenda Mesir"
                            onPressMore={() => handleSeeAll('egypt', 'Maestro & Legenda Mesir')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                            {egyptQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    onPress={handleSelectQari}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Qari Arab Saudi */}
                {saudiQaris.length > 0 && (
                    <View style={styles.sectionWrapper}>
                        <SectionHeader
                            title="Qari Arab Saudi"
                            onPressMore={() => handleSeeAll('saudi', 'Qari Arab Saudi')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                            {saudiQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    onPress={handleSelectQari}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Qari Internasional */}
                {internationalQaris.length > 0 && (
                    <View style={styles.sectionWrapper}>
                        <SectionHeader
                            title="Qari Internasional"
                            onPressMore={() => handleSeeAll('international', 'Qari Internasional')}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                            {internationalQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    onPress={handleSelectQari}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ height: 230 }} />
            </Animated.ScrollView>

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
    scrollContent: {
        paddingTop: Spacing.xl,
    },
    header: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.size.largeTitle,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        letterSpacing: Typography.tracking.tight,
    },
    searchContainer: {
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 0.5,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.subhead,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
    },
    sectionWrapper: {
        marginBottom: Spacing.xl,
    },
    horizontalList: {
        paddingHorizontal: Spacing.pagePadding,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
        gap: 8,
    },
    emptyTitle: {
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        marginTop: 6,
    },
    emptySubtitle: {
        fontSize: Typography.size.footnote,
        fontFamily: Typography.fontFamily.text,
        textAlign: 'center',
        lineHeight: 18,
    },
});
