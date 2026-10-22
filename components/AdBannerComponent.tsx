import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { ACTIVE_BANNER_ID, isExpoGo } from '@/services/adMobService';
import { Ionicons } from '@expo/vector-icons';
import { PremiumPaywallModal } from '@/components/PremiumPaywallModal';

// Native Google Mobile Ads Banner (aman di Expo Go & aktif di Standalone Production)
let BannerAd: any = null;
let BannerAdSize: any = null;

if (!isExpoGo) {
    try {
        const GoogleMobileAds = require('react-native-google-mobile-ads');
        BannerAd = GoogleMobileAds.BannerAd;
        BannerAdSize = GoogleMobileAds.BannerAdSize;
    } catch (e) {
        console.warn('⚠️ [AdMob] BannerAd native module could not be loaded:', e);
    }
}

interface AdBannerComponentProps {
    bottomOffset?: number;
}

export const AdBannerComponent: React.FC<AdBannerComponentProps> = ({ bottomOffset = 0 }) => {
    const { isPremium } = useSubscription();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { adBannerAnimatedStyle } = useTabBarAnimation();
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [adLoaded, setAdLoaded] = useState(false);

    // Pengguna Premium 100% bebas dari segala jenis iklan
    if (isPremium) {
        return null;
    }

    // Tampilan di Expo Go (Simulasi banner yang bersih & elegan)
    if (isExpoGo || !BannerAd) {
        return (
            <Animated.View style={[
                styles.container,
                {
                    bottom: bottomOffset,
                    backgroundColor: isDark ? '#111114' : '#F4F4F6',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
                adBannerAnimatedStyle,
            ]}>
                <TouchableOpacity
                    style={styles.mockContent}
                    activeOpacity={0.8}
                    onPress={() => setPaywallVisible(true)}
                >
                    <View style={styles.adBadge}>
                        <Text style={styles.adBadgeText}>IKLAN</Text>
                    </View>
                    <Text
                        style={[
                            styles.mockText,
                            { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }
                        ]}
                        numberOfLines={1}
                    >
                        Dengarkan Al-Qur'an tanpa jeda iklan
                    </Text>
                    <View style={styles.removeAdBtn}>
                        <Ionicons name="sparkles" size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.removeAdBtnText}>Hapus Iklan</Text>
                    </View>
                </TouchableOpacity>

                <PremiumPaywallModal
                    visible={paywallVisible}
                    onClose={() => setPaywallVisible(false)}
                />
            </Animated.View>
        );
    }

    // Tampilan di Native Build (Production / Real Google AdMob Banner)
    return (
        <Animated.View style={[
            styles.container,
            {
                bottom: bottomOffset,
                backgroundColor: 'transparent',
                borderWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
            },
            adBannerAnimatedStyle,
            !adLoaded && { height: 0, opacity: 0, overflow: 'hidden' }
        ]}>
            <BannerAd
                unitId={ACTIVE_BANNER_ID}
                size={BannerAdSize?.ANCHORED_ADAPTIVE_BANNER || BannerAdSize?.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => setAdLoaded(true)}
                onAdFailedToLoad={(error: any) => {
                    console.warn('AdMob Banner failed to load:', error);
                    setAdLoaded(false);
                }}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 14,
        right: 14,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        zIndex: 45,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    mockContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        width: '100%',
        height: 48,
    },
    adBadge: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    adBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    mockText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    removeAdBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    removeAdBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10B981',
    },
});
