import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity, Image, ImageBackground, Alert, ActionSheetIOS, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { fetchSurahs, Surah, getAudioUrl, QARIS, Qari } from '@/services/quranApi';
import { FeaturedCard } from '@/components/FeaturedCard';
import { SectionHeader } from '@/components/SectionHeader';
import { QariAvatar } from '@/components/QariAvatar';
import { SurahListItem } from '@/components/SurahListItem';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';

export default function HomeScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { playSurah, currentTrack, isPlaying, startSleepTimer, cancelSleepTimer, sleepTimerActive, position, duration } = useAudio();

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQari, setSelectedQari] = useState<Qari>(QARIS[0]);
    const [locationName, setLocationName] = useState('Memuat lokasi...');

    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [nextPrayer, setNextPrayer] = useState<string | null>(null);

    // Logic for Featured Banner
    let bannerSurah = surahs.find(s => s.number === 67); // Default Al-Mulk
    let bannerQari = selectedQari;

    if (currentTrack && surahs.length > 0) {
        // If playing, find the current surah
        const found = surahs.find(s => s.number === currentTrack.surahNumber);
        if (found) {
            bannerSurah = found;
        }
        // Find the qari for the current track
        const playingQari = QARIS.find(q => q.id === currentTrack.qariId);
        if (playingQari) {
            bannerQari = playingQari;
        }
    }

    // Recommendations (e.g. Kahf, Yasin, Waqiah)
    const recommendations = surahs.filter(s => [18, 36, 56].includes(s.number));

    useEffect(() => {
        loadData();
        getLocation();
    }, []);

    const getLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationName('Lokasi tidak diizinkan');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let address = await Location.reverseGeocodeAsync(location.coords);

            if (address && address.length > 0) {
                const { city, district, region } = address[0];
                setLocationName(district || city || region || 'Lokasi ditemukan');
            }

            fetchPrayerTimes(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            setLocationName('Gagal memuat lokasi');
        }
    };

    const fetchPrayerTimes = async (lat: number, long: number) => {
        try {
            const date = Math.floor(Date.now() / 1000);
            // Method 20 is Kemenag Indonesia
            const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${long}&method=20`);
            const data = await response.json();
            if (data.code === 200) {
                setPrayerTimes(data.data.timings);
                determineNextPrayer(data.data.timings);
            }
        } catch (error) {
            console.error('Error fetching prayer times', error);
        }
    };

    const determineNextPrayer = (timings: any) => {
        // Simple logic to find next prayer based on current time
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        for (const prayer of prayerOrder) {
            const [hours, minutes] = timings[prayer].split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            if (prayerTime > currentTime) {
                setNextPrayer(prayer);
                return;
            }
        }
        setNextPrayer('Fajr'); // Next day
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
                        startSleepTimer(values[buttonIndex]); // Fixed variable name
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

    const QuickAction = ({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors[theme].quickActionBg }]}>
                {/* Custom handling for icons to match design style */}
                <Ionicons
                    name={icon as any}
                    size={28}
                    color={Colors[theme].tint}
                />
            </View>
            <Text style={[styles.quickActionLabel, { color: Colors[theme].subtitle }]}>{label}</Text>
        </TouchableOpacity>
    );

    const PrayerItem = ({ name, time, isNext }: { name: string, time: string, isNext: boolean }) => (
        <View style={[styles.prayerItem, isNext && { backgroundColor: Colors[theme].tint, borderColor: Colors[theme].tint }]}>
            <Text style={[styles.prayerName, { color: isNext ? '#FFF' : Colors[theme].subtitle }]}>{name}</Text>
            <Text style={[styles.prayerTime, { color: isNext ? '#FFF' : Colors[theme].text }]}>{time}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={14} color={Colors[theme].subtitle} />
                            <Text style={[styles.location, { color: Colors[theme].subtitle }]}> {locationName}</Text>
                        </View>
                        <Text style={[styles.greeting, { color: Colors[theme].text }]}>Assalamu’alaikum</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
                        <Ionicons name="settings-outline" size={24} color={Colors[theme].text} />
                    </TouchableOpacity>
                </View>

                {/* Prayer Times Widget */}
                {prayerTimes && (
                    <View style={styles.prayerSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prayerList}>
                            <PrayerItem name="Subuh" time={prayerTimes.Fajr} isNext={nextPrayer === 'Fajr'} />
                            <PrayerItem name="Dzuhur" time={prayerTimes.Dhuhr} isNext={nextPrayer === 'Dhuhr'} />
                            <PrayerItem name="Ashar" time={prayerTimes.Asr} isNext={nextPrayer === 'Asr'} />
                            <PrayerItem name="Maghrib" time={prayerTimes.Maghrib} isNext={nextPrayer === 'Maghrib'} />
                            <PrayerItem name="Isya" time={prayerTimes.Isha} isNext={nextPrayer === 'Isha'} />
                        </ScrollView>
                    </View>
                )}

                {/* Featured Card */}
                {bannerSurah && (
                    <FeaturedCard
                        surah={bannerSurah}
                        qari={bannerQari}
                        onPress={() => handlePlay(bannerSurah!)}
                        isPlaying={isPlaying && currentTrack?.surahNumber === bannerSurah.number}
                        position={currentTrack?.surahNumber === bannerSurah.number ? position : 0}
                        duration={currentTrack?.surahNumber === bannerSurah.number ? duration : 0}
                    />
                )}

                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <QuickAction icon="book" label="Semua Surah" onPress={() => router.push('/all-surahs')} />
                    <QuickAction icon="heart" label="Favorit" onPress={() => router.push('/(tabs)/favorites')} />
                    <QuickAction icon="moon" label={sleepTimerActive ? "Timer Aktif" : "Timer Tidur"} onPress={handleSleepTimer} />
                    <QuickAction icon="musical-notes" label="Playlist" onPress={() => router.push('/playlist')} />
                </View>

                {/* Recommendations */}
                <View style={styles.sectionHeaderContainer}>
                    <SectionHeader title="Rekomendasi untuk Anda" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {recommendations.map((surah) => (
                        <View key={surah.number} style={{ width: 280, marginRight: 16 }}>
                            {/* Update SurahListItem visual if needed, for now standard is okay but maybe needs background image */}
                            <ImageBackground
                                source={require('@/assets/images/banner_bg.png')}
                                style={{ borderRadius: 16, overflow: 'hidden' }}
                                imageStyle={{ opacity: 0.6 }} // Dim background
                            >
                                <LinearGradient
                                    colors={theme === 'dark' ? ['rgba(15, 28, 27, 0.9)', 'rgba(15, 28, 27, 0.7)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                                    style={{ padding: 4 }}
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

                {/* Qari Selection */}
                <View style={[styles.sectionHeaderContainer, { marginTop: 8 }]}>
                    <SectionHeader title="Qari Pilihan" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {QARIS.map((qari) => (
                        <QariAvatar
                            key={qari.id}
                            qari={qari}
                            isSelected={selectedQari.id === qari.id}
                            onPress={setSelectedQari}
                        />
                    ))}
                </ScrollView>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24, // Increased padding
        marginBottom: 24,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    location: {
        fontSize: 13, // Slightly larger
    },
    greeting: {
        fontSize: 22, // Refined size
        fontWeight: '500', // Lighter weight like Apple Design
        letterSpacing: -0.5,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 12,
        gap: 12,
    },
    quickAction: {
        alignItems: 'center',
        flex: 1, // Distribute evenly
    },
    quickActionIcon: {
        width: 60, // Larger
        height: 60,
        borderRadius: 20, // Softer radius
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        // Removed shadow for flatter aesthetic or kept subtle
    },
    quickActionLabel: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    sectionHeaderContainer: {
        paddingHorizontal: 4, // Header handles its own padding usually but let's align
    },
    horizontalScroll: {
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    prayerSection: {
        marginBottom: 24,
    },
    prayerList: {
        paddingHorizontal: 24,
    },
    prayerItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 10,
        backgroundColor: 'rgba(0,0,0,0.03)', // subtle background
        borderWidth: 1,
        borderColor: 'transparent',
    },
    prayerName: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
    },
    prayerTime: {
        fontSize: 14,
        fontWeight: '700',
    },
});
