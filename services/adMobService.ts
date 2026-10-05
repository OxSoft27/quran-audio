import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AdMob App ID
export const ADMOB_APP_ID = 'ca-app-pub-5515124991118089~1890726735';

// Real Ad Unit IDs dari Dashboard AdMob
export const ADMOB_UNITS = {
    banner: 'ca-app-pub-5515124991118089/3922079422',
    interstitial: 'ca-app-pub-5515124991118089/8443692641',
};

// Google Official Test Ad Unit IDs (digunakan saat development agar akun AdMob tidak di-banned)
export const ADMOB_TEST_UNITS = {
    // Official Google Test Banner ID for iOS
    banner: 'ca-app-pub-3940256099942544/2934735716',
    // Official Google Test Interstitial ID for iOS
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
};

// Cek apakah berjalan di Expo Go
export const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Gunakan Test IDs di development mode, dan Real IDs di production build
export const ACTIVE_BANNER_ID = __DEV__ ? ADMOB_TEST_UNITS.banner : ADMOB_UNITS.banner;
export const ACTIVE_INTERSTITIAL_ID = __DEV__ ? ADMOB_TEST_UNITS.interstitial : ADMOB_UNITS.interstitial;

const SURAH_PLAY_COUNT_KEY = '@quranflow_surah_play_count_v1';
const PENDING_AD_KEY = '@quranflow_pending_interstitial_v1';

// Native Google Mobile Ads module (null saat di Expo Go / mode development)
const MobileAds: any = null;
const InterstitialAd: any = null;
const AdEventType: any = null;
let loadedInterstitial: any = null;

export interface AdShowCallbacks {
    onAdWillShow?: () => void;
    onAdDismissed?: () => void;
}

/**
 * Inisialisasi Google Mobile Ads SDK
 */
export async function initializeAdMob(): Promise<void> {
    if (isExpoGo || !MobileAds) {
        console.log('ℹ️ [AdMob] Mode Expo Go / Simulasi aktif. Modul native AdMob dinonaktifkan.');
        return;
    }

    try {
        await MobileAds().initialize();
        console.log('✅ [AdMob] Google Mobile Ads berhasil diinisialisasi.');
        preloadInterstitial();
    } catch (error) {
        console.warn('⚠️ [AdMob] Gagal inisialisasi AdMob:', error);
    }
}

/**
 * Preload Interstitial Ad agar siap tayang saat dibutuhkan
 */
function preloadInterstitial(): void {
    if (isExpoGo || !InterstitialAd) return;

    try {
        const ad = InterstitialAd.createForAdRequest(ACTIVE_INTERSTITIAL_ID, {
            requestNonPersonalizedAdsOnly: true, // Non-personalized ads sesuai standar privasi
        });

        ad.addAdEventListener(AdEventType.LOADED, () => {
            loadedInterstitial = ad;
            console.log('✅ [AdMob] Interstitial Ad siap ditayangkan.');
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
            loadedInterstitial = null;
            // Muat ulang untuk giliran berikutnya
            preloadInterstitial();
        });

        ad.addAdEventListener(AdEventType.ERROR, (err: any) => {
            console.warn('⚠️ [AdMob] Interstitial gagal dimuat:', err);
            loadedInterstitial = null;
        });

        ad.load();
    } catch (e) {
        console.warn('⚠️ [AdMob] Error preload interstitial:', e);
    }
}

/**
 * Dipanggil setiap kali pengguna memutar / berpindah surah.
 * Menghitung kelipatan 2 surah. Jika sudah 2 kali pindah surah dan BUKAN user Premium:
 * - Cek apakah layar sedang menyala & aktif di aplikasi (AppState === 'active').
 * - Jika layar dikunci/background: Iklan disimpan sebagai "Tertunda" (Pending) agar tidak hilang.
 * - Jika layar aktif di foreground: Segera tayangkan iklan tertunda / reguler, jeda audio, dan lanjutkan setelah ditutup.
 */
export async function notifySurahChanged(
    isPremium: boolean,
    callbacks?: AdShowCallbacks
): Promise<void> {
    // Pengguna Premium 100% bebas dari segala jenis iklan
    if (isPremium) {
        return;
    }

    try {
        const currentCountStr = await AsyncStorage.getItem(SURAH_PLAY_COUNT_KEY);
        let count = currentCountStr ? parseInt(currentCountStr, 10) : 0;
        count += 1;
        await AsyncStorage.setItem(SURAH_PLAY_COUNT_KEY, count.toString());

        const pendingAd = await AsyncStorage.getItem(PENDING_AD_KEY);
        const isTargetAdCount = count % 2 === 0;
        const shouldShowAd = isTargetAdCount || pendingAd === 'true';

        console.log(`📊 [AdMob] Perpindahan Surah ke-${count}. (Target kelipatan: ${isTargetAdCount}, Ada iklan tertunda: ${pendingAd === 'true'})`);

        if (shouldShowAd) {
            const isAppActive = AppState.currentState === 'active';

            // KONDISI 1: Layar dikunci / aplikasi di background
            if (!isAppActive) {
                // Simpan status pending agar hak penayangan iklan tidak hilang saat user buka layar nanti
                await AsyncStorage.setItem(PENDING_AD_KEY, 'true');
                console.log('🔒 [AdMob] Layar terkunci / background. Iklan disimpan sebagai "Tertunda" (Pending) dan akan tayang saat pengguna membuka aplikasi.');
                return;
            }

            // KONDISI 2: Layar sedang menyala / aplikasi aktif di depan
            // Hapus status pending dan tayangkan iklan
            await AsyncStorage.removeItem(PENDING_AD_KEY);
            await showInterstitialAd(callbacks);
        }
    } catch (error) {
        console.warn('⚠️ [AdMob] Error tracking surah change:', error);
    }
}

/**
 * Menampilkan Interstitial Ad dengan sinkronisasi jeda & resume audio
 */
export async function showInterstitialAd(callbacks?: AdShowCallbacks): Promise<void> {
    const isAppActive = AppState.currentState === 'active';
    if (!isAppActive) {
        console.log('🔒 [AdMob] Aplikasi tidak aktif di foreground. Iklan tidak ditampilkan.');
        return;
    }

    if (isExpoGo || !loadedInterstitial) {
        if (isExpoGo) {
            console.log('ℹ️ [AdMob] Simulasi: Interstitial Ad tayang di sini (Layar Menyala).');
        } else {
            preloadInterstitial();
        }
        return;
    }

    let hasResumed = false;
    const resumeAudioOnce = () => {
        if (!hasResumed) {
            hasResumed = true;
            callbacks?.onAdDismissed?.();
        }
    };

    try {
        // 1. Jeda pemutaran audio sebelum iklan tampil
        callbacks?.onAdWillShow?.();

        // 2. Pasang event listener penutupan iklan untuk melanjutkan pemutaran
        if (AdEventType) {
            const unsubscribeClosed = loadedInterstitial.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log('✅ [AdMob] Iklan ditutup oleh pengguna. Melanjutkan pemutaran audio...');
                    resumeAudioOnce();
                    unsubscribeClosed?.();
                }
            );

            const unsubscribeError = loadedInterstitial.addAdEventListener(
                AdEventType.ERROR,
                (err: any) => {
                    console.warn('⚠️ [AdMob] Error saat menayangkan iklan:', err);
                    resumeAudioOnce();
                    unsubscribeError?.();
                }
            );
        }

        // 3. Tampilkan iklan layar penuh
        await loadedInterstitial.show();
    } catch (error) {
        console.warn('⚠️ [AdMob] Gagal menampilkan Interstitial:', error);
        // Pastikan audio tetap berlanjut jika iklan gagal ditampilkan
        resumeAudioOnce();
    }
}
