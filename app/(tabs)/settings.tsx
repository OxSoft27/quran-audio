import { PremiumPaywallModal } from '@/components/PremiumPaywallModal';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { openPrivacyPolicy, openTermsOfService } from '@/constants/legal';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { useTheme } from '@/context/ThemeContext';
import { openIosLanguageSettings } from '@/services/i18n';
import { isNotificationPermitted, requestNotificationPermissions, scheduleDailyVersesForNext30Days } from '@/services/notificationService';
import { getRandomVerse } from '@/services/notificationsData';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated from 'react-native-reanimated';

export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { scrollHandler } = useTabBarAnimation();
    const { theme, mode, setMode } = useTheme();
    const isDark = theme === 'dark';

    const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
    const [cacheSize, setCacheSize] = useState<number>(0);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [isNotifActive, setIsNotifActive] = useState<boolean>(false);

    useEffect(() => {
        isNotificationPermitted().then(setIsNotifActive);
    }, []);

    const getDirectorySize = async (dirUri: string): Promise<number> => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(dirUri);
            if (!dirInfo.exists) return 0;
            const contents = await FileSystem.readDirectoryAsync(dirUri);
            let total = 0;
            for (const file of contents) {
                const fileUri = `${dirUri}${file}`;
                const info = await FileSystem.getInfoAsync(fileUri);
                if (info.exists) {
                    if (info.isDirectory) {
                        total += await getDirectorySize(`${fileUri}/`);
                    } else {
                        total += info.size || 0;
                    }
                }
            }
            return total;
        } catch {
            return 0;
        }
    };

    const calculateCacheSize = useCallback(async () => {
        try {
            if (!FileSystem.cacheDirectory) return;
            const total = await getDirectorySize(FileSystem.cacheDirectory);
            setCacheSize(total);
        } catch (e) {
            console.log('Error calculating cache size:', e);
        }
    }, []);

    useEffect(() => {
        calculateCacheSize();
    }, [calculateCacheSize]);

    const formatCacheSize = (bytes: number) => {
        if (bytes <= 0) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    const getCurrentLanguageLabel = () => {
        const lang = i18n.language || 'id';
        if (lang.startsWith('en')) return 'English 🇺🇸';
        if (lang.startsWith('ar')) return 'العربية 🇸🇦';
        return 'Bahasa Indonesia 🇮🇩';
    };

    const handleLanguagePress = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await openIosLanguageSettings();
    };

    const handleClearCache = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const formatted = formatCacheSize(cacheSize);
        Alert.alert(
            'Bersihkan Cache',
            `Apakah Anda yakin ingin membersihkan file cache aplikasi (${formatted})?\n\nCatatan: Data surah yang sudah Anda unduh offline TIDAK akan terhapus.`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Bersihkan Cache',
                    style: 'destructive',
                    onPress: async () => {
                        setIsClearingCache(true);
                        try {
                            if (FileSystem.cacheDirectory) {
                                const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
                                for (const file of files) {
                                    try {
                                        await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${file}`, { idempotent: true });
                                    } catch { }
                                }
                            }
                            await calculateCacheSize();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Sukses', 'Semua file cache sementara berhasil dibersihkan.');
                        } catch (err) {
                            Alert.alert('Gagal', 'Terjadi kendala saat membersihkan cache.');
                        } finally {
                            setIsClearingCache(false);
                        }
                    },
                },
            ]
        );
    };

    const handleOpenPremium = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsPremiumModalVisible(true);
    };

    const handleRedeemCode = () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Aktifkan Kode',
                'Masukkan kode promo atau voucher Premium:',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Aktifkan',
                        onPress: (code?: string) => {
                            if (code && code.trim().length > 0) {
                                Alert.alert('Sukses', `Kode ${code.toUpperCase()} berhasil diaktifkan!`);
                            }
                        },
                    },
                ]
            );
        } else {
            Alert.alert('Aktifkan Kode', 'Fitur masukkan kode promo aktif.');
        }
    };

    const handleNotificationPress = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const permitted = await isNotificationPermitted();
        if (!permitted) {
            const granted = await requestNotificationPermissions();
            setIsNotifActive(granted);
            if (granted) {
                Alert.alert('Notifikasi Aktif', 'Pengingat harian ayat penyejuk hati telah dijadwalkan otomatis untuk 30 hari ke depan.');
            } else {
                Alert.alert(
                    'Izin Ditolak',
                    'Untuk menerima ayat harian penyejuk hati, izinkan notifikasi pada Pengaturan iOS.',
                    [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } else {
            Alert.alert(
                'Notifikasi Ayat Harian',
                'Pengingat harian aktif dijadwalkan setiap pukul 20:00 malam.',
                [
                    {
                        text: 'Kirim Notifikasi Tes Sekarang',
                        onPress: async () => {
                            const verse = getRandomVerse();
                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: `✨ ${verse.title}`,
                                    body: `${verse.arabic}\n\n"${verse.body}"\n— QS. ${verse.surahName}: ${verse.ayahNumber}`,
                                    sound: true,
                                    data: {
                                        surahNumber: verse.surahNumber,
                                        ayahNumber: verse.ayahNumber,
                                        audioUrl: verse.audioUrl,
                                        surahName: verse.surahName,
                                        title: verse.title,
                                        category: verse.category,
                                        isTest: true,
                                        url: `quranflow://play?surah=${verse.surahNumber}&ayah=${verse.ayahNumber}&audioUrl=${encodeURIComponent(verse.audioUrl)}&surahName=${encodeURIComponent(verse.surahName)}`,
                                    },
                                },
                                trigger: null,
                            });
                            Alert.alert('Terkirim!', 'Notifikasi tes telah dikirimkan. Ketuk banner notifikasi untuk menguji pemutaran murottal otomatis.');
                        },
                    },
                    {
                        text: 'Jadwalkan Ulang 30 Hari',
                        onPress: async () => {
                            const count = await scheduleDailyVersesForNext30Days(20, 0);
                            Alert.alert('Sukses', `${count} hari notifikasi ayat berhasil diperbarui.`);
                        },
                    },
                    { text: 'Tutup', style: 'cancel' },
                ]
            );
        }
    };

    const handleSupportEmail = useCallback(async (type: 'feature' | 'bug' | 'contact') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const email = 'lunaris.devapp@gmail.com';
        const appVersion = Constants.expoConfig?.version || '1.0.0';
        const buildNum = Constants.expoConfig?.ios?.buildNumber || '1';
        const device = Platform.OS === 'ios' ? (Platform.isPad ? 'iPad' : 'iPhone') : 'Android Device';
        const osVersion = `${Platform.Version}`;

        let intro = '';
        if (type === 'feature') {
            intro = 'Assalamu alaikum, saya punya saran fitur untuk aplikasi iOS QuranFlow:';
        } else if (type === 'bug') {
            intro = 'Assalamu alaikum, saya menemukan bug di aplikasi iOS QuranFlow:';
        } else {
            intro = 'Assalamu alaikum, saya ingin menghubungi Anda mengenai aplikasi iOS QuranFlow.';
        }

        const body = `${intro}\n\n\n--------------------\nApp Version: ${appVersion} (${buildNum})\nDevice: ${device}\niOS: ${osVersion}\n--------------------`;
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent('QuranFlow Support')}&body=${encodeURIComponent(body)}`;

        try {
            const canOpen = await Linking.canOpenURL(mailtoUrl);
            if (canOpen) {
                await Linking.openURL(mailtoUrl);
            } else {
                Alert.alert(
                    'Hubungi Kami',
                    `Silakan kirimkan email ke:\n\n${email}`,
                    [{ text: 'OK' }]
                );
            }
        } catch {
            Linking.openURL(mailtoUrl).catch(() => {
                Alert.alert('Email Dukungan', `Silakan kirimkan email ke: ${email}`);
            });
        }
    }, []);

    const SectionGroup = ({
        title,
        children,
    }: {
        title?: string;
        children: React.ReactNode;
    }) => (
        <View style={styles.sectionGroupWrapper}>
            {title && (
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.5)' },
                    ]}
                >
                    {title}
                </Text>
            )}
            <View
                style={[
                    styles.groupCard,
                    {
                        backgroundColor: isDark ? '#151518' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    },
                ]}
            >
                {children}
            </View>
        </View>
    );

    const RowItem = ({
        icon,
        label,
        sublabel,
        value,
        badge,
        onPress,
        isLast = false,
    }: {
        icon: React.ReactNode;
        label: string;
        sublabel?: string;
        value?: string;
        badge?: React.ReactNode;
        onPress?: () => void;
        isLast?: boolean;
    }) => (
        <TouchableOpacity
            style={[
                styles.rowItem,
                !isLast && [
                    styles.rowItemBorder,
                    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' },
                ],
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
            activeOpacity={0.7}
        >
            <View style={styles.rowIconContainer}>{icon}</View>
            <View style={styles.rowContent}>
                <Text
                    style={[
                        styles.rowLabel,
                        { color: isDark ? '#FFFFFF' : '#111827' },
                    ]}
                >
                    {label}
                </Text>
                {sublabel && (
                    <Text
                        style={[
                            styles.rowSublabel,
                            { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                        ]}
                    >
                        {sublabel}
                    </Text>
                )}
            </View>
            {value && (
                <Text
                    style={[
                        styles.rowValue,
                        { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)' },
                    ]}
                >
                    {value}
                </Text>
            )}
            {badge}
            <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}
            />
        </TouchableOpacity>
    );

    const iconColor = isDark ? '#FFFFFF' : '#1F2937';

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
                        {t('settings.title', 'Pengaturan')}
                    </Text>
                </View>

                {/* Hero Banner: Dapatkan Premium */}
                <TouchableOpacity
                    style={styles.premiumHeroCard}
                    onPress={handleOpenPremium}
                    activeOpacity={0.85}
                >
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroInfo}>
                        <View style={styles.heroTitleRow}>
                            <Ionicons name="diamond" size={18} color="#000000" style={{ marginRight: 6 }} />
                            <Text style={styles.heroTitle}>Dapatkan Premium</Text>
                        </View>
                        <Text style={styles.heroSubtitle}>
                            Akses semua fitur dan bantu kami berkembang
                        </Text>
                    </View>
                    <View style={styles.heroChevron}>
                        <Ionicons name="chevron-forward" size={20} color="#000000" />
                    </View>
                </TouchableOpacity>

                {/* Section: Tampilan & Tema */}
                <SectionGroup title={t('settings.appearance', 'Tampilan')}>
                    <View style={[styles.themeSelectorWrapper, { backgroundColor: isDark ? '#1F1F23' : '#F4F4F5' }]}>
                        <TouchableOpacity
                            style={[
                                styles.themeBtn,
                                mode === 'light' && [styles.themeBtnActive, { backgroundColor: isDark ? '#27272A' : '#FFFFFF' }],
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMode('light');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="sunny"
                                size={16}
                                color={mode === 'light' ? (isDark ? '#F59E0B' : '#D97706') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')}
                            />
                            <Text
                                style={[
                                    styles.themeBtnText,
                                    { color: mode === 'light' ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)') },
                                    mode === 'light' && styles.themeBtnTextActive,
                                ]}
                            >
                                {t('settings.themeLight', 'Terang')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.themeBtn,
                                mode === 'dark' && [styles.themeBtnActive, { backgroundColor: isDark ? '#27272A' : '#FFFFFF' }],
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMode('dark');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="moon"
                                size={16}
                                color={mode === 'dark' ? '#38BDF8' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')}
                            />
                            <Text
                                style={[
                                    styles.themeBtnText,
                                    { color: mode === 'dark' ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)') },
                                    mode === 'dark' && styles.themeBtnTextActive,
                                ]}
                            >
                                {t('settings.themeDark', 'Gelap')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.themeBtn,
                                mode === 'system' && [styles.themeBtnActive, { backgroundColor: isDark ? '#27272A' : '#FFFFFF' }],
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMode('system');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="phone-portrait-outline"
                                size={16}
                                color={mode === 'system' ? '#10B981' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')}
                            />
                            <Text
                                style={[
                                    styles.themeBtnText,
                                    { color: mode === 'system' ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)') },
                                    mode === 'system' && styles.themeBtnTextActive,
                                ]}
                            >
                                {t('settings.themeSystem', 'Sistem')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SectionGroup>

                {/* Section: Langganan */}
                <SectionGroup title="Langganan">
                    <RowItem
                        icon={<Ionicons name="diamond-outline" size={20} color={iconColor} />}
                        label="Dapatkan Premium"
                        onPress={handleOpenPremium}
                    />
                    <RowItem
                        icon={<Ionicons name="pricetag-outline" size={20} color={iconColor} />}
                        label="Aktifkan kode"
                        onPress={handleRedeemCode}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Umum */}
                <SectionGroup title={t('settings.general', 'Umum')}>
                    <RowItem
                        icon={<Ionicons name="globe-outline" size={20} color={iconColor} />}
                        label={t('settings.language', 'Bahasa')}
                        sublabel={t('settings.languageDesc', 'Buka Pengaturan iOS untuk memilih bahasa')}
                        value={getCurrentLanguageLabel()}
                        onPress={handleLanguagePress}
                    />
                    <RowItem
                        icon={<Ionicons name="arrow-down-circle-outline" size={20} color={iconColor} />}
                        label={t('playlist.offlineDownloads', 'Manajer unduhan')}
                        onPress={() => router.push('/(tabs)/playlist')}
                    />
                    <RowItem
                        icon={<Ionicons name="notifications-outline" size={20} color={iconColor} />}
                        label="Ayat Harian & Notifikasi"
                        sublabel="Koleksi penyejuk hati & widget harian"
                        value={isNotifActive ? 'Aktif (20:00)' : 'Atur'}
                        onPress={handleNotificationPress}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Penyimpanan & Cache */}
                <SectionGroup title={t('settings.audioAndDownloads', 'Penyimpanan & Cache')}>
                    <RowItem
                        icon={<Ionicons name="trash-bin-outline" size={20} color={isDark ? '#F87171' : '#DC2626'} />}
                        label={t('settings.clearCache', 'Bersihkan Cache')}
                        sublabel={
                            isClearingCache
                                ? 'Sedang membersihkan file sementara...'
                                : `Hapus file sementara & memori buffer (${formatCacheSize(cacheSize)})`
                        }
                        badge={
                            <View
                                style={[
                                    styles.cacheBadge,
                                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)' },
                                ]}
                            >
                                {isClearingCache ? (
                                    <ActivityIndicator size="small" color={isDark ? '#F87171' : '#DC2626'} />
                                ) : (
                                    <Text style={[styles.cacheBadgeText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                                        {formatCacheSize(cacheSize)}
                                    </Text>
                                )}
                            </View>
                        }
                        onPress={handleClearCache}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Bantu kami berkembang */}
                <SectionGroup title={`🤍 ${t('settings.helpUsGrow', 'Bantu kami berkembang')}`}>
                    <RowItem
                        icon={
                            <View style={styles.giftIconWrap}>
                                <Ionicons name="gift" size={16} color="#FFFFFF" />
                            </View>
                        }
                        label={t('settings.freePremiumChallenge', 'Tantangan Premium gratis')}
                        sublabel={t('settings.freePremiumChallengeDesc', 'Posting QuranFlow di media sosial dan dapatkan keanggotaan premium gratis')}
                        onPress={() => Alert.alert('Coming Soon', 'Fitur Tantangan Premium Gratis akan segera hadir.')}
                    />
                    <RowItem
                        icon={<Ionicons name="bulb-outline" size={20} color={iconColor} />}
                        label={t('settings.suggestFeature', 'Minta atau sarankan fitur')}
                        onPress={() => handleSupportEmail('feature')}
                    />
                    <RowItem
                        icon={<Ionicons name="warning-outline" size={20} color={iconColor} />}
                        label={t('settings.reportBug', 'Laporkan bug')}
                        onPress={() => handleSupportEmail('bug')}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Tentang */}
                <SectionGroup title={t('settings.about', 'Tentang')}>
                    <RowItem
                        icon={<Ionicons name="person-add-outline" size={20} color={iconColor} />}
                        label="Ikuti kami"
                        onPress={() => Alert.alert('Ikuti Kami', 'Kunjungi @quranflow.id di Instagram dan TikTok')}
                    />
                    <RowItem
                        icon={<Ionicons name="star-outline" size={20} color={iconColor} />}
                        label="Beri rating"
                        onPress={() => Alert.alert('Rating', 'Terima kasih telah memberikan ulasan bintang 5 di App Store!')}
                    />
                    <RowItem
                        icon={<Ionicons name="information-circle-outline" size={20} color={iconColor} />}
                        label="Tentang QuranFlow"
                        onPress={() => router.push('/about')}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Hukum */}
                <SectionGroup title="Hukum">
                    <RowItem
                        icon={<Ionicons name="document-text-outline" size={20} color={iconColor} />}
                        label={t('settings.termsOfService', 'Syarat layanan')}
                        onPress={openTermsOfService}
                    />
                    <RowItem
                        icon={<Ionicons name="shield-checkmark-outline" size={20} color={iconColor} />}
                        label={t('settings.privacyPolicy', 'Kebijakan privasi')}
                        onPress={openPrivacyPolicy}
                        isLast
                    />
                </SectionGroup>

                {/* Section: Hubungi */}
                <SectionGroup title="Hubungi">
                    <RowItem
                        icon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
                        label="Hubungi kami"
                        onPress={() => handleSupportEmail('contact')}
                        isLast
                    />
                </SectionGroup>

                <View style={{ height: 230 }} />
            </Animated.ScrollView>

            {/* Premium Paywall Modal */}
            <PremiumPaywallModal
                visible={isPremiumModalVisible}
                onClose={() => setIsPremiumModalVisible(false)}
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
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.size.largeTitle,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        color: '#FFFFFF',
        letterSpacing: Typography.tracking.tight,
    },
    premiumHeroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: Spacing.pagePadding,
        borderRadius: 24,
        padding: 16,
        marginBottom: Spacing.xl,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    heroImage: {
        width: 58,
        height: 58,
        borderRadius: 29,
        marginRight: 14,
    },
    heroInfo: {
        flex: 1,
    },
    heroTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: Typography.size.callout,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        color: '#000000',
    },
    heroSubtitle: {
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
        color: 'rgba(0, 0, 0, 0.65)',
        lineHeight: 16,
    },
    heroChevron: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sectionGroupWrapper: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.pagePadding,
    },
    sectionTitle: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        color: 'rgba(255, 255, 255, 0.45)',
        marginBottom: 8,
        marginLeft: 8,
        letterSpacing: 0.2,
    },
    groupCard: {
        backgroundColor: '#151518',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    rowItemBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    rowIconContainer: {
        width: 28,
        alignItems: 'center',
        marginRight: 12,
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
        color: '#FFFFFF',
    },
    rowSublabel: {
        fontSize: Typography.size.caption1,
        fontFamily: Typography.fontFamily.text,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 2,
        lineHeight: 16,
    },
    rowValue: {
        fontSize: Typography.size.subhead,
        marginRight: 6,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
    },
    giftIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeSelectorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 14,
        margin: 8,
    },
    themeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    themeBtnActive: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    themeBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    themeBtnTextActive: {
        fontWeight: '700',
    },
    cacheBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginRight: 6,
    },
    cacheBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
