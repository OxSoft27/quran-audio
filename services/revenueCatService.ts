import { Platform } from 'react-native';
import Purchases, {
    PurchasesPackage,
    CustomerInfo,
    LOG_LEVEL,
} from 'react-native-purchases';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Public Apple API Key from RevenueCat dashboard
// User can replace this with their actual key from https://app.revenuecat.com/
export const REVENUECAT_APPLE_KEY =
    process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_VcOIWXBDSnFMlgYRKXSOoTzmDNw';

// Identifier of Entitlement in RevenueCat (matches what is configured in RevenueCat dashboard)
export const ENTITLEMENT_ID = 'premium_access';

const MOCK_STORAGE_KEY = '@mock_premium_status_v1';

// Detect if running inside the Expo Go client app
export const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Gracefully no-ops in Expo Go to prevent native module crashes
 */
export async function initializeRevenueCat(): Promise<void> {
    if (isConfigured) return;

    if (isExpoGo) {
        console.log(
            'ℹ️ [RevenueCat] Berjalan di Expo Go. Modul native In-App Purchase dinonaktifkan, mode simulasi aktif.'
        );
        return;
    }

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return;
    }

    try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
            isConfigured = true;
            console.log('✅ [RevenueCat] Berhasil diinisialisasi untuk iOS.');
        }
    } catch (error) {
        console.warn('⚠️ [RevenueCat] Gagal inisialisasi:', error);
    }
}

/**
 * Get available subscription packages from RevenueCat
 */
export async function fetchOfferings(): Promise<{
    monthly: PurchasesPackage | null;
    yearly: PurchasesPackage | null;
    all: PurchasesPackage[];
}> {
    if (isExpoGo || !isConfigured) {
        return {
            monthly: null,
            yearly: null,
            all: [],
        };
    }

    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
            const all = offerings.current.availablePackages;
            const monthly =
                all.find((p) => p.packageType === 'MONTHLY') || null;
            const yearly =
                all.find((p) => p.packageType === 'ANNUAL') || null;
            return { monthly, yearly, all };
        }
    } catch (error) {
        console.warn('⚠️ [RevenueCat] Gagal mengambil offerings:', error);
    }

    return { monthly: null, yearly: null, all: [] };
}

/**
 * Purchase a selected subscription package
 */
export async function purchaseSubscriptionPackage(
    pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: any }> {
    if (isExpoGo || !isConfigured) {
        // Mock purchase in Expo Go
        await AsyncStorage.setItem(MOCK_STORAGE_KEY, 'true');
        return { success: true };
    }

    try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const isPremium =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        return { success: isPremium, customerInfo };
    } catch (error: any) {
        if (!error.userCancelled) {
            console.error('❌ [RevenueCat] Pembelian gagal:', error);
        }
        return { success: false, error };
    }
}

/**
 * Restore previous purchases (Mandatory for Apple App Store guidelines)
 */
export async function restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
}> {
    if (isExpoGo || !isConfigured) {
        const isMockActive = (await AsyncStorage.getItem(MOCK_STORAGE_KEY)) === 'true';
        return { success: isMockActive };
    }

    try {
        const customerInfo = await Purchases.restorePurchases();
        const isPremium =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        return { success: isPremium, customerInfo };
    } catch (error) {
        console.error('❌ [RevenueCat] Restore gagal:', error);
        return { success: false };
    }
}

/**
 * Check if the current user has active Premium entitlement
 */
export async function checkPremiumStatus(): Promise<boolean> {
    if (isExpoGo || !isConfigured) {
        try {
            const saved = await AsyncStorage.getItem(MOCK_STORAGE_KEY);
            return saved === 'true';
        } catch {
            return false;
        }
    }

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
        console.warn('⚠️ [RevenueCat] Gagal cek status customer:', error);
        return false;
    }
}

/**
 * Reset premium state (for testing purposes)
 */
export async function resetMockPremiumStatus(): Promise<void> {
    await AsyncStorage.removeItem(MOCK_STORAGE_KEY);
}
