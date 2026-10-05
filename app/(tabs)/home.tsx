import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity, Image, ImageBackground, Alert, ActionSheetIOS, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import Animated from 'react-native-reanimated';
import { fetchSurahs, Surah, getAudioUrl, QARIS, Qari } from '@/services/quranApi';
import { FeaturedCard } from '@/components/FeaturedCard';
import { FavoriteQariHero } from '@/components/FavoriteQariHero';
import { ManageFavoriteQarisModal } from '@/components/ManageFavoriteQarisModal';
import { SectionHeader } from '@/components/SectionHeader';
import { QariAvatar } from '@/components/QariAvatar';
import { SurahListItem } from '@/components/SurahListItem';
import { BlurView } from 'expo-blur';
import { InsightsCard } from '@/components/InsightsCard';
import { PremiumPaywallModal } from '@/components/PremiumPaywallModal';
import { THEMED_PLAYLISTS } from '@/app/(tabs)/playlist';
import { CityLocation, DEFAULT_CITY } from '@/constants/cities';
import { calculatePrayerTimes, getSavedLocation, saveLocation, getDeviceGpsLocation, PrayerTimesData } from '@/services/prayerTimesService';
import { LocationPickerModal } from '@/components/LocationPickerModal';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BENTO_GAP = 12;
const BENTO_CARD_WIDTH = (SCREEN_WIDTH - Spacing.pagePadding * 2 - BENTO_GAP) / 2;

export default function HomeScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const { playSurah, currentTrack, isPlaying, startSleepTimer, cancelSleepTimer, sleepTimerActive, position, duration, togglePlayPause, playNext } = useAudio();
    const { favoriteQaris } = useFavorites();
    const { scrollHandler } = useTabBarAnimation();

    const PRAYER_LIST = [
        { key: 'Fajr', name: t('home.prayerFajr', 'Subuh') },
        { key: 'Dhuhr', name: t('home.prayerDhuhr', 'Dzuhur') },
        { key: 'Asr', name: t('home.prayerAsr', 'Ashar') },
        { key: 'Maghrib', name: t('home.prayerMaghrib', 'Maghrib') },
        { key: 'Isha', name: t('home.prayerIsha', 'Isya') },
    ];

    const DEFAULT_BANNER_SURAH: Surah = {
        number: 67,
        name: 'سورة الملك',
        englishName: 'Al-Mulk',
        englishNameTranslation: 'The Sovereignty',
        numberOfAyahs: 30,
        revelationType: 'Meccan',
    };

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQari, setSelectedQari] = useState<Qari>(QARIS[0]);
    const [currentLocation, setCurrentLocation] = useState<CityLocation>(DEFAULT_CITY);
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [isManageModalVisible, setIsManageModalVisible] = useState(false);
    const [prayerData, setPrayerData] = useState<PrayerTimesData>(() =>
        calculatePrayerTimes(DEFAULT_CITY.latitude, DEFAULT_CITY.longitude, new Date(), DEFAULT_CITY.name, DEFAULT_CITY.timezone)
    );

    const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);

    // Filter favorite Qaris based on user preference
    const favoriteQariList = QARIS.filter(q => favoriteQaris.includes(q.id));
    const displayedFavoriteQaris = favoriteQariList.length > 0 ? favoriteQariList : QARIS.slice(0, 4);

    // Hero qari: selected qari if in favorites, otherwise the first favorite
    const heroQari = displayedFavoriteQaris.find(q => q.id === selectedQari.id) || displayedFavoriteQaris[0];

    // New Qaris for the "Qari baru" section matching reference
    const NEW_QARI_IDS = ['ali_hudhaify', 'ahmed_kaseb', 'khalil_al_saghir'];
    const newQaris = QARIS.filter(q => NEW_QARI_IDS.includes(q.id));

    // Tajwid Qaris for "Untuk tajwid" section
    const tajwidQaris = QARIS.filter(q => q.specialty?.includes('tajwid'));

    // Logic for Featured Banner (Lanjutkan Mendengarkan)
    const activeBannerSurah =
        (currentTrack && surahs.find(s => s.number === currentTrack.surahNumber)) ||
        surahs.find(s => s.number === 67) ||
        DEFAULT_BANNER_SURAH;

    const activeBannerQari =
        (currentTrack && QARIS.find(q => q.id === currentTrack.qariId)) ||
        selectedQari ||
        QARIS[0];

    const isBannerPlaying = isPlaying && currentTrack?.surahNumber === activeBannerSurah.number;
    const bannerPosition = currentTrack?.surahNumber === activeBannerSurah.number ? position : 0;
    const bannerDuration = currentTrack?.surahNumber === activeBannerSurah.number ? duration : 0;

    const handleToggleBannerPlay = () => {
        if (currentTrack && currentTrack.surahNumber === activeBannerSurah.number) {
            togglePlayPause();
        } else {
            const url = getAudioUrl(activeBannerQari.id, activeBannerSurah.number);
            playSurah(url, {
                surahName: activeBannerSurah.englishName,
                qariName: activeBannerQari.name,
                surahNumber: activeBannerSurah.number,
                qariId: activeBannerQari.id,
            });
        }
    };

    const handleBannerNext = () => {
        if (currentTrack) {
            playNext();
        } else {
            const nextNum = activeBannerSurah.number < 114 ? activeBannerSurah.number + 1 : 1;
            const nextSurah = surahs.find(s => s.number === nextNum);
            if (nextSurah) {
                const url = getAudioUrl(activeBannerQari.id, nextSurah.number);
                playSurah(url, {
                    surahName: nextSurah.englishName,
                    qariName: activeBannerQari.name,
                    surahNumber: nextSurah.number,
                    qariId: activeBannerQari.id,
                });
            }
        }
    };

    // Recommendations (e.g. Kahf, Yasin, Waqiah)
    const recommendations = surahs.filter(s => [18, 36, 56].includes(s.number));

    useEffect(() => {
        loadData();
        initLocationAndPrayers();
    }, []);

    // Periodic timer: update prayer status, countdown, and recalculate on midnight date change
    useEffect(() => {
        const interval = setInterval(() => {
            setPrayerData(calculatePrayerTimes(currentLocation.latitude, currentLocation.longitude, new Date(), currentLocation.name, currentLocation.timezone));
        }, 30000);
        return () => clearInterval(interval);
    }, [currentLocation]);

    const initLocationAndPrayers = async () => {
        const saved = await getSavedLocation();
        setCurrentLocation(saved);
        const initialTimes = calculatePrayerTimes(saved.latitude, saved.longitude, new Date(), saved.name, saved.timezone);
        setPrayerData(initialTimes);

        // If saved location is GPS or default, verify GPS silently
        if (saved.id === 'gps_current' || saved.id === DEFAULT_CITY.id) {
            try {
                const res = await getDeviceGpsLocation();
                if (res && res.location && !res.isSimulator) {
                    setCurrentLocation(res.location);
                    setPrayerData(calculatePrayerTimes(res.location.latitude, res.location.longitude, new Date(), res.location.name, res.location.timezone));
                }
            } catch (e) {
                // Keep saved location
            }
        }
    };

    const handleSelectLocation = async (newLoc: CityLocation) => {
        setCurrentLocation(newLoc);
        await saveLocation(newLoc);
        setPrayerData(calculatePrayerTimes(newLoc.latitude, newLoc.longitude, new Date(), newLoc.name, newLoc.timezone));
    };

    const handleRequestGpsExplicit = async () => {
        setIsGpsLoading(true);
        try {
            const res = await getDeviceGpsLocation();
            if (res && res.location) {
                setCurrentLocation(res.location);
                setPrayerData(calculatePrayerTimes(res.location.latitude, res.location.longitude, new Date(), res.location.name, res.location.timezone));
                if (res.isSimulator) {
                    Alert.alert(
                        'Simulator iOS Terdeteksi',
                        'Simulator mendeteksi koordinat bawaan San Francisco. Lokasi otomatis diarahkan ke Jakarta Pusat agar jadwal sholat tetap akurat.',
                        [{ text: 'OK' }]
                    );
                }
            } else if (res?.error) {
                Alert.alert('Lokasi GPS', res.error, [{ text: 'OK' }]);
            }
        } finally {
            setIsGpsLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        const data = await fetchSurahs();
        setSurahs(data);
        setLoading(false);
    };

    const handlePlay = (surah: Surah) => {
        const url = getAudioUrl(selectedQari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: selectedQari.name,
            surahNumber: surah.number,
            qariId: selectedQari.id,
        });
    };

    const handlePlayHero = () => {
        const targetSurah = activeBannerSurah || surahs[0];
        if (!targetSurah) return;
        const url = getAudioUrl(heroQari.id, targetSurah.number);
        playSurah(url, {
            surahName: targetSurah.englishName,
            qariName: heroQari.name,
            surahNumber: targetSurah.number,
            qariId: heroQari.id,
        });
        setSelectedQari(heroQari);
    };

    const handleContinueListening = () => {
        if (currentTrack) {
            togglePlayPause();
        } else {
            handlePlayHero();
        }
    };

    const handleSleepTimer = () => {
        if (sleepTimerActive) {
            Alert.alert(
                "Timer Tidur Aktif",
                "Ingin mematikan timer?",
                [
                    { text: "Batal", style: "cancel" },
                    { text: "Matikan", style: "destructive", onPress: () => cancelSleepTimer() }
                ]
            );
            return;
        }

        const options = ['15 Menit', '30 Menit', '45 Menit', '60 Menit', 'Batal'];
        const values = [15, 30, 45, 60];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: options,
                    cancelButtonIndex: 4,
                    title: 'Atur Waktu Tidur'
                },
                (buttonIndex) => {
                    if (buttonIndex < 4) {
                        startSleepTimer(values[buttonIndex]);
                        Alert.alert("Timer Diatur", `Audio akan berhenti dalam ${options[buttonIndex]}.`);
                    }
                }
            );
        } else {
            Alert.alert(
                "Atur Timer Tidur",
                "Pilih durasi:",
                [
                    { text: "15 Menit", onPress: () => { startSleepTimer(15); Alert.alert("Timer Diatur", "15 Menit"); } },
                    { text: "30 Menit", onPress: () => { startSleepTimer(30); Alert.alert("Timer Diatur", "30 Menit"); } },
                    { text: "60 Menit", onPress: () => { startSleepTimer(60); Alert.alert("Timer Diatur", "60 Menit"); } },
                    { text: "Batal", style: "cancel" }
                ]
            );
        }
    };

    interface BentoCardProps {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle: string;
        accentColor: string;
        onPress: () => void;
        isActive?: boolean;
    }

    const BentoCard = ({ icon, title, subtitle, accentColor, onPress, isActive }: BentoCardProps) => {
        const isDark = theme === 'dark';
        return (
            <TouchableOpacity
                style={[
                    styles.bentoCard,
                    {
                        backgroundColor: isDark ? '#141417' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                    isActive && {
                        borderColor: `${accentColor}60`,
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.72}
            >
                <View style={styles.bentoCardTop}>
                    <View style={[styles.bentoIconBadge, { backgroundColor: `${accentColor}18` }]}>
                        <Ionicons name={icon} size={22} color={accentColor} />
                    </View>
                    {isActive ? (
                        <View style={[styles.bentoActivePill, { backgroundColor: `${accentColor}22` }]}>
                            <View style={[styles.bentoActiveDot, { backgroundColor: accentColor }]} />
                            <Text style={[styles.bentoActiveText, { color: accentColor }]}>
                                {t('home.sleepTimerActive', 'Aktif')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.bentoChevronWrap}>
                            <Ionicons
                                name="chevron-forward"
                                size={15}
                                color={isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.28)'}
                            />
                        </View>
                    )}
                </View>
                <View style={styles.bentoCardBottom}>
                    <Text
                        style={[
                            styles.bentoTitle,
                            { color: Colors[theme].text }
                        ]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[
                            styles.bentoSubtitle,
                            { color: isActive ? accentColor : Colors[theme].subtitle }
                        ]}
                        numberOfLines={1}
                    >
                        {subtitle}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const isDark = theme === 'dark';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F4F4F5' }]}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
            >
                {/* Header: Location pin + Assalamu'alaikum + Settings gear */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.locationContainer}
                            onPress={() => setIsLocationModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="location-sharp"
                                size={14}
                                color="#10B981"
                            />
                            <Text style={[styles.location, { color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#374151' }]}>
                                {' '}{currentLocation.name}
                            </Text>
                            <Ionicons
                                name="chevron-down"
                                size={12}
                                color={isDark ? 'rgba(255, 255, 255, 0.45)' : '#9CA3AF'}
                                style={{ marginLeft: 3 }}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.greeting, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                            {t('home.greeting', "Assalamu'alaikum")}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsIconButton}
                        onPress={() => router.push('/(tabs)/settings')}
                        activeOpacity={0.7}
                        accessibilityLabel={t('tabs.settings', 'Pengaturan')}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={25}
                            color={isDark ? '#FFFFFF' : '#18181B'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Prayer Times Widget */}
                {prayerData && (
                    <View style={styles.prayerSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.prayerList}
                        >
                            {PRAYER_LIST.map((item) => {
                                const isNext = prayerData.nextPrayer === item.key;
                                const time = (prayerData as any)[item.key] || '00:00';
                                if (isNext) {
                                    return (
                                        <View key={item.key} style={styles.activePrayerBadge}>
                                            <Text style={styles.activePrayerName}>{item.name}</Text>
                                            <Text style={styles.activePrayerTime}>{time}</Text>
                                        </View>
                                    );
                                }
                                return (
                                    <View key={item.key} style={styles.inactivePrayerItem}>
                                        <Text style={[styles.inactivePrayerName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.inactivePrayerTime, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                                            {time}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        {prayerData.countdownText ? (
                            <TouchableOpacity
                                style={styles.countdownRow}
                                onPress={() => setIsLocationModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="time-outline" size={13} color="#10B981" />
                                <Text style={[styles.countdownText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {prayerData.countdownText} • {prayerData.methodName}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {/* Hero Card: Lanjutkan Mendengarkan (Placed directly BEFORE Daftar Putar) */}
                <FeaturedCard
                    surah={activeBannerSurah}
                    qari={activeBannerQari}
                    onPress={() => handlePlay(activeBannerSurah)}
                    onPressPlay={handleToggleBannerPlay}
                    onPressNext={handleBannerNext}
                    isPlaying={isBannerPlaying}
                    position={bannerPosition}
                    duration={bannerDuration}
                />

                {/* Section: Akses Cepat (Bento Grid 2x2) */}
                <SectionHeader title={t('home.quickAccess', 'Akses Cepat')} />
                <View style={styles.bentoGrid}>
                    <BentoCard
                        icon="book"
                        title={t('home.allSurahs', 'Semua Surah')}
                        subtitle={t('home.allSurahsSubtitle', "114 Surah Al-Qur'an")}
                        accentColor="#10B981"
                        onPress={() => router.push('/all-surahs' as any)}
                    />
                    <BentoCard
                        icon="heart"
                        title={t('tabs.favorites', 'Favorit')}
                        subtitle={t('home.favoritesSubtitle', 'Koleksi tersimpan')}
                        accentColor="#F43F5E"
                        onPress={() => router.push('/(tabs)/favorites' as any)}
                    />
                    <BentoCard
                        icon="moon"
                        title={t('home.sleepTimer', 'Timer Tidur')}
                        subtitle={sleepTimerActive ? t('home.sleepTimerActive', 'Sedang berjalan') : t('home.sleepTimerAuto', 'Mati otomatis')}
                        accentColor="#0EA5E9"
                        onPress={handleSleepTimer}
                        isActive={sleepTimerActive}
                    />
                    <BentoCard
                        icon="musical-notes"
                        title={t('tabs.playlist', 'Daftar Putar')}
                        subtitle={t('home.playlistSubtitle', 'Tema & offline')}
                        accentColor="#8B5CF6"
                        onPress={() => router.push('/(tabs)/playlist' as any)}
                    />
                </View>

                {/* Section: Daftar Putar */}
                <SectionHeader
                    title={t('home.themedPlaylists', 'Daftar Putar')}
                    onPressMore={() => router.push('/(tabs)/playlist' as any)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {THEMED_PLAYLISTS.map((pl) => (
                        <TouchableOpacity
                            key={pl.id}
                            style={styles.playlistHomeCard}
                            onPress={() => router.push('/(tabs)/playlist' as any)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={pl.colors}
                                style={styles.playlistCardGrad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={[styles.playlistIconBadge, { backgroundColor: `${pl.accentColor}25` }]}>
                                    <Ionicons name={pl.icon} size={20} color={pl.accentColor} />
                                </View>
                                <Text style={styles.playlistCardTitle} numberOfLines={1}>{pl.title}</Text>
                                <Text style={styles.playlistCardCount}>{pl.surahNumbers.length} Surah</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Hero: Dari favorit Anda */}
                {heroQari && (
                    <FavoriteQariHero
                        qari={heroQari}
                        onPressPlay={handlePlayHero}
                        isPlaying={isPlaying && currentTrack?.qariId === heroQari.id}
                    />
                )}

                {/* Section: Favorit Anda */}
                <SectionHeader
                    title={`⭐ ${t('home.yourFavorites', 'Favorit Anda')}`}
                    onPressMore={() => setIsManageModalVisible(true)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {displayedFavoriteQaris.map((qari) => (
                        <QariAvatar
                            key={qari.id}
                            qari={qari}
                            isSelected={selectedQari.id === qari.id}
                            onPress={(q) => setSelectedQari(q)}
                        />
                    ))}
                </ScrollView>

                {/* Wawasan / Insights Card */}
                <InsightsCard
                    onPressContinue={handleContinueListening}
                    onPressMore={() => router.push('/all-surahs' as any)}
                />

                {/* Section: Untuk tajwid */}
                {tajwidQaris.length > 0 && (
                    <>
                        <SectionHeader
                            title={t('home.forTajwid', 'Untuk tajwid')}
                            onPressMore={() => router.push('/(tabs)/qari' as any)}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                            {tajwidQaris.map((qari) => (
                                <QariAvatar
                                    key={qari.id}
                                    qari={qari}
                                    isSelected={selectedQari.id === qari.id}
                                    onPress={(q) => setSelectedQari(q)}
                                />
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* Section: Qari Baru */}
                <SectionHeader
                    title={t('home.newQaris', 'Qari baru')}
                    onPressMore={() => setIsManageModalVisible(true)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {newQaris.map((qari) => (
                        <QariAvatar
                            key={qari.id}
                            qari={qari}
                            badge="BARU"
                            isSelected={selectedQari.id === qari.id}
                            onPress={(q) => setSelectedQari(q)}
                        />
                    ))}
                </ScrollView>



                {/* Recommendations */}
                <SectionHeader title="Rekomendasi untuk Anda" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {recommendations.map((surah) => (
                        <View key={surah.number} style={{ width: 280, marginRight: Spacing.lg }}>
                            <ImageBackground
                                source={require('@/assets/images/Masjid.jpg')}
                                style={{ borderRadius: Spacing.lg, overflow: 'hidden' }}
                                imageStyle={{ opacity: 0.6 }}
                            >
                                <LinearGradient
                                    colors={theme === 'dark' ? ['rgba(15, 28, 27, 0.9)', 'rgba(15, 28, 27, 0.7)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                                    style={{ padding: Spacing.xs }}
                                >
                                    <SurahListItem
                                        surah={surah}
                                        onPress={() => handlePlay(surah)}
                                    />
                                </LinearGradient>
                            </ImageBackground>
                        </View>
                    ))}
                </ScrollView>

                {/* Modal to manage favorite Qaris */}
                <ManageFavoriteQarisModal
                    visible={isManageModalVisible}
                    onClose={() => setIsManageModalVisible(false)}
                    onSelectQari={(q) => setSelectedQari(q)}
                />

                {/* Modal for Premium Paywall */}
                <PremiumPaywallModal
                    visible={isPremiumModalVisible}
                    onClose={() => setIsPremiumModalVisible(false)}
                />

                {/* Modal for Picking City & GPS Location */}
                <LocationPickerModal
                    visible={isLocationModalVisible}
                    onClose={() => setIsLocationModalVisible(false)}
                    currentLocation={currentLocation}
                    onSelectLocation={handleSelectLocation}
                    onRequestGps={handleRequestGpsExplicit}
                    isGpsLoading={isGpsLoading}
                />

                <View style={{ height: 230 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.pagePadding,
        marginBottom: Spacing.lg + 4,
        paddingTop: Spacing.xs,
    },
    headerLeft: {
        flex: 1,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    location: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.text,
    },
    greeting: {
        fontSize: Typography.size.largeTitle,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.display,
        letterSpacing: Typography.tracking.tight,
    },
    settingsIconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.pagePadding,
        gap: BENTO_GAP,
        marginTop: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    bentoCard: {
        width: BENTO_CARD_WIDTH,
        height: 114,
        borderRadius: 20,
        padding: 14,
        justifyContent: 'space-between',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 2,
    },
    bentoCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bentoIconBadge: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bentoChevronWrap: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bentoActivePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 5,
    },
    bentoActiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    bentoActiveText: {
        fontSize: 10,
        fontWeight: Typography.weight.bold,
        fontFamily: Typography.fontFamily.primary,
        letterSpacing: 0.3,
    },
    bentoCardBottom: {
        marginTop: 6,
    },
    bentoTitle: {
        fontSize: 15,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.display,
        letterSpacing: -0.2,
    },
    bentoSubtitle: {
        fontSize: 12,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        marginTop: 2,
    },
    horizontalScroll: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: Spacing.sm,
    },
    playlistHomeCard: {
        width: 140,
        height: 120,
        borderRadius: 18,
        overflow: 'hidden',
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    playlistCardGrad: {
        flex: 1,
        padding: Spacing.md,
        justifyContent: 'space-between',
    },
    playlistIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playlistCardTitle: {
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        color: '#FFFFFF',
    },
    playlistCardCount: {
        fontSize: Typography.size.caption2,
        color: 'rgba(255, 255, 255, 0.65)',
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    prayerSection: {
        marginBottom: Spacing.xl,
    },
    prayerList: {
        paddingHorizontal: Spacing.pagePadding,
        alignItems: 'center',
        gap: 18,
    },
    activePrayerBadge: {
        backgroundColor: '#1DB8B5',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 76,
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    activePrayerName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        marginBottom: 2,
    },
    activePrayerTime: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    inactivePrayerItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    inactivePrayerName: {
        fontSize: 13,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.text,
        marginBottom: 4,
    },
    inactivePrayerTime: {
        fontSize: 17,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    countdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.pagePadding,
        marginTop: 10,
        gap: 5,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
