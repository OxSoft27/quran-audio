import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { CityLocation, DEFAULT_CITY } from '@/constants/cities';

const LOCATION_STORAGE_KEY = '@user_prayer_location_v3';

export interface PrayerTimesData {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Sunrise: string;
    currentPrayer: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'none';
    nextPrayer: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
    nextPrayerName: string;
    nextPrayerTime: string;
    countdownText: string;
    locationName: string;
    methodName: string;
    dateFormatted: string;
}

const PRAYER_INDONESIAN_NAMES: Record<string, string> = {
    Fajr: 'Subuh',
    Dhuhr: 'Dzuhur',
    Asr: 'Ashar',
    Maghrib: 'Maghrib',
    Isha: 'Isya',
};

/**
 * Detect accurate IANA Timezone based on geographic coordinates
 * Covers Indonesian timezones (WIB, WITA, WIT) and overseas (Saudi Arabia, etc.)
 */
export function getTimezoneForCoordinates(latitude: number, longitude: number): string {
    // Indonesia bounding box approx: Lat -11.5 to 6.5, Lon 94.5 to 141.5
    if (latitude >= -11.5 && latitude <= 6.5 && longitude >= 94.5 && longitude <= 141.5) {
        if (longitude < 110.0) {
            return 'Asia/Jakarta'; // WIB (UTC+7)
        } else if (longitude < 125.0) {
            return 'Asia/Makassar'; // WITA (UTC+8)
        } else {
            return 'Asia/Jayapura'; // WIT (UTC+9)
        }
    }

    // Saudi Arabia (Makkah, Madinah, Riyadh)
    if (latitude >= 16 && latitude <= 32 && longitude >= 34 && longitude <= 56) {
        return 'Asia/Riyadh';
    }

    // Default to device's current timezone if overseas
    try {
        const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (deviceTz) return deviceTz;
    } catch (e) { }

    return 'Asia/Jakarta';
}

/**
 * Format Date to HH:mm string in 24-hour format with timezone support
 */
export function formatTimeHHmm(date: Date, timeZone?: string): string {
    if (timeZone) {
        try {
            return new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone,
            }).format(date);
        } catch (e) {
            // Fallback if timezone string is invalid
        }
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Calculate prayer times for any coordinate and date using the official Kemenag RI method
 * (or Umm Al-Qura / MWL for international coords), formatted to the target timezone (WIB, WITA, WIT, overseas)
 */
export function calculatePrayerTimes(
    latitude: number,
    longitude: number,
    targetDate: Date = new Date(),
    locationName: string = DEFAULT_CITY.name,
    timeZone?: string
): PrayerTimesData {
    const coords = new Coordinates(latitude, longitude);
    const targetTz = timeZone || getTimezoneForCoordinates(latitude, longitude);

    // Determine calculation parameters based on region
    let params;
    let methodName = 'Kemenag RI';

    // Indonesia bounding box approx: Lat -11 to 6, Lon 95 to 141
    const isIndonesia = latitude >= -11.5 && latitude <= 6.5 && longitude >= 94.5 && longitude <= 141.5;
    // Saudi Arabia approx: Lat 16 to 32, Lon 34 to 56
    const isSaudi = latitude >= 16 && latitude <= 32 && longitude >= 34 && longitude <= 56;

    if (isIndonesia) {
        // Official Kemenag RI Standard:
        // Subuh: -20.0 deg, Isya: -18.0 deg, +2-3 mins Ihtiyat (safety buffer)
        params = CalculationMethod.Singapore();
        params.fajrAngle = 20.0;
        params.ishaAngle = 18.0;
        params.adjustments = {
            fajr: 2,
            sunrise: 0,
            dhuhr: 3,
            asr: 2,
            maghrib: 2,
            isha: 2,
        };
        methodName = 'Kemenag RI';
    } else if (isSaudi) {
        params = CalculationMethod.UmmAlQura();
        methodName = 'Umm Al-Qura (Makkah)';
    } else {
        params = CalculationMethod.MuslimWorldLeague();
        methodName = 'Muslim World League';
    }

    const pt = new PrayerTimes(coords, targetDate, params);

    // Calculate Imsak (10 minutes before Fajr as per Indonesian tradition)
    const imsakDate = new Date(pt.fajr.getTime() - 10 * 60 * 1000);

    // Determine Next Prayer & Current Prayer
    const now = new Date();
    // Compare times using same-day timestamps
    let nextPrayerKey: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' = 'Fajr';
    let nextPrayerDate = pt.fajr;
    let currentPrayerKey: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'none' = 'none';

    if (now < pt.fajr) {
        nextPrayerKey = 'Fajr';
        nextPrayerDate = pt.fajr;
        currentPrayerKey = 'Isha'; // night before Fajr
    } else if (now < pt.dhuhr) {
        nextPrayerKey = 'Dhuhr';
        nextPrayerDate = pt.dhuhr;
        currentPrayerKey = 'Fajr';
    } else if (now < pt.asr) {
        nextPrayerKey = 'Asr';
        nextPrayerDate = pt.asr;
        currentPrayerKey = 'Dhuhr';
    } else if (now < pt.maghrib) {
        nextPrayerKey = 'Maghrib';
        nextPrayerDate = pt.maghrib;
        currentPrayerKey = 'Asr';
    } else if (now < pt.isha) {
        nextPrayerKey = 'Isha';
        nextPrayerDate = pt.isha;
        currentPrayerKey = 'Maghrib';
    } else {
        // Today's prayers are complete, next prayer is Fajr tomorrow
        const tomorrow = new Date(targetDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ptTomorrow = new PrayerTimes(coords, tomorrow, params);
        nextPrayerKey = 'Fajr';
        nextPrayerDate = ptTomorrow.fajr;
        currentPrayerKey = 'Isha';
    }

    // Countdown calculation
    const diffMs = Math.max(0, nextPrayerDate.getTime() - now.getTime());
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = '';
    if (diffHrs > 0) {
        countdownText = `${diffHrs} jam ${diffMins} mnt menuju ${PRAYER_INDONESIAN_NAMES[nextPrayerKey]}`;
    } else if (diffMins > 0) {
        countdownText = `${diffMins} menit menuju ${PRAYER_INDONESIAN_NAMES[nextPrayerKey]}`;
    } else {
        countdownText = `Waktu ${PRAYER_INDONESIAN_NAMES[nextPrayerKey]} telah tiba`;
    }

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    const dateFormatted = targetDate.toLocaleDateString('id-ID', options);

    return {
        Fajr: formatTimeHHmm(pt.fajr, targetTz),
        Dhuhr: formatTimeHHmm(pt.dhuhr, targetTz),
        Asr: formatTimeHHmm(pt.asr, targetTz),
        Maghrib: formatTimeHHmm(pt.maghrib, targetTz),
        Isha: formatTimeHHmm(pt.isha, targetTz),
        Imsak: formatTimeHHmm(imsakDate, targetTz),
        Sunrise: formatTimeHHmm(pt.sunrise, targetTz),
        currentPrayer: currentPrayerKey,
        nextPrayer: nextPrayerKey,
        nextPrayerName: PRAYER_INDONESIAN_NAMES[nextPrayerKey] || 'Subuh',
        nextPrayerTime: formatTimeHHmm(nextPrayerDate, targetTz),
        countdownText,
        locationName,
        methodName,
        dateFormatted,
    };
}

/**
 * Check if given coordinates correspond to the Apple iOS Simulator default (Union Square / San Francisco)
 */
export function isAppleSimulatorLocation(lat: number, lon: number): boolean {
    // Apple Silicon simulator defaults to ~37.7858, -122.4064 (Union Square SF)
    return Math.abs(lat - 37.7858) < 0.2 && Math.abs(lon - (-122.4064)) < 0.2;
}

/**
 * Load saved city location from AsyncStorage, or fallback to default Jakarta Pusat
 */
export async function getSavedLocation(): Promise<CityLocation> {
    try {
        const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to load saved prayer location', e);
    }
    return DEFAULT_CITY;
}

/**
 * Save user's selected location to AsyncStorage
 */
export async function saveLocation(location: CityLocation): Promise<void> {
    try {
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (e) {
        console.warn('Failed to save prayer location', e);
    }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
}

/**
 * Request GPS location from device, intelligently filtering out simulator Union Square defaults
 */
export async function getDeviceGpsLocation(): Promise<{
    location: CityLocation;
    isSimulator: boolean;
    error?: string;
}> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            const fallback = await getSavedLocation();
            return {
                location: fallback,
                isSimulator: false,
                error: 'Izin lokasi ditolak, menggunakan lokasi tersimpan.',
            };
        }

        // Try getting last known position first (fast 0ms cache)
        let position = await Location.getLastKnownPositionAsync().catch(() => null);

        // If no cached position, query current position with a 4-second timeout guard
        if (!position) {
            position = await withTimeout(
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                }),
                4000,
                null
            );
        }

        if (!position || !position.coords) {
            const fallback = await getSavedLocation();
            return {
                location: fallback,
                isSimulator: false,
                error: 'Sinyal GPS lemah atau timeout, menggunakan lokasi tersimpan.',
            };
        }

        const { latitude, longitude } = position.coords;

        // Detect if this is the Apple Simulator default (Union Square SF)
        if (isAppleSimulatorLocation(latitude, longitude)) {
            // Default to Jakarta Pusat for accurate Indonesian prayer times
            return {
                location: DEFAULT_CITY,
                isSimulator: true,
            };
        }

        // Reverse geocode with a 3-second timeout guard to prevent network hang
        let name = 'Lokasi Saya';
        let province = '';
        let country = 'Indonesia';

        try {
            const geocoded = await withTimeout(
                Location.reverseGeocodeAsync({ latitude, longitude }),
                3000,
                []
            );
            if (geocoded && geocoded.length > 0) {
                const geo = geocoded[0];
                const cleanDistrict = geo.district || geo.subregion || '';
                const cleanCity = geo.city || geo.region || '';
                name = cleanCity ? (cleanDistrict ? `${cleanDistrict}, ${cleanCity}` : cleanCity) : (geo.name || 'Lokasi Saya');
                province = geo.region || '';
                country = geo.country || 'Indonesia';
            }
        } catch (geoError) {
            console.warn('Reverse geocode failed, using coordinates', geoError);
        }

        const resolvedLocation: CityLocation = {
            id: 'gps_current',
            name,
            province,
            country,
            latitude,
            longitude,
            timezone: getTimezoneForCoordinates(latitude, longitude),
        };

        await saveLocation(resolvedLocation);

        return {
            location: resolvedLocation,
            isSimulator: false,
        };
    } catch (error: any) {
        console.warn('GPS location lookup error:', error);
        const fallback = await getSavedLocation();
        return {
            location: fallback,
            isSimulator: false,
            error: error?.message || 'Gagal memuat GPS',
        };
    }
}
