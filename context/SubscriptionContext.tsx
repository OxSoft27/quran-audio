import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import {
    initializeRevenueCat,
    fetchOfferings,
    purchaseSubscriptionPackage,
    restorePurchases,
    checkPremiumStatus,
    isExpoGo,
} from '@/services/revenueCatService';

export interface PurchasePlanResult {
    success: boolean;
    userCancelled?: boolean;
    errorMessage?: string;
}

interface SubscriptionContextType {
    isPremium: boolean;
    isLoading: boolean;
    isExpoGo: boolean;
    monthlyPackage: PurchasesPackage | null;
    yearlyPackage: PurchasesPackage | null;
    allPackages: PurchasesPackage[];
    purchasePlan: (plan: 'monthly' | 'yearly') => Promise<PurchasePlanResult>;
    restore: () => Promise<boolean>;
    refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    isPremium: false,
    isLoading: true,
    isExpoGo: false,
    monthlyPackage: null,
    yearlyPackage: null,
    allPackages: [],
    purchasePlan: async () => ({ success: false }),
    restore: async () => false,
    refreshStatus: async () => { },
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
    const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
    const [allPackages, setAllPackages] = useState<PurchasesPackage[]>([]);

    const loadOfferingsAndStatus = useCallback(async () => {
        try {
            await initializeRevenueCat();
            const premiumActive = await checkPremiumStatus();
            setIsPremium(premiumActive);

            const { monthly, yearly, all } = await fetchOfferings();
            setMonthlyPackage(monthly);
            setYearlyPackage(yearly);
            setAllPackages(all);
        } catch (error) {
            console.warn('⚠️ [SubscriptionContext] Gagal memuat status langganan:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOfferingsAndStatus();
    }, [loadOfferingsAndStatus]);

    const purchasePlan = async (plan: 'monthly' | 'yearly'): Promise<PurchasePlanResult> => {
        setIsLoading(true);
        try {
            const targetPkg = plan === 'yearly' ? yearlyPackage : monthlyPackage;

            // In Expo Go or if package is not yet linked in dashboard, simulate purchase
            if (!targetPkg || isExpoGo) {
                const res = await purchaseSubscriptionPackage(targetPkg as any);
                if (res.success) {
                    setIsPremium(true);
                    return { success: true };
                }
                return {
                    success: false,
                    userCancelled: res.userCancelled,
                    errorMessage: res.errorMessage,
                };
            }

            const res = await purchaseSubscriptionPackage(targetPkg);
            if (res.success) {
                setIsPremium(true);
                return { success: true };
            }
            return {
                success: false,
                userCancelled: res.userCancelled,
                errorMessage: res.errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    };

    const restore = async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const res = await restorePurchases();
            setIsPremium(res.success);
            return res.success;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshStatus = async () => {
        await loadOfferingsAndStatus();
    };

    return (
        <SubscriptionContext.Provider
            value={{
                isPremium,
                isLoading,
                isExpoGo,
                monthlyPackage,
                yearlyPackage,
                allPackages,
                purchasePlan,
                restore,
                refreshStatus,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);
