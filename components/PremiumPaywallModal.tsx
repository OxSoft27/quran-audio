import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useSubscription } from '@/context/SubscriptionContext';
import { openPrivacyPolicy, openTermsOfService } from '@/constants/legal';

const { width } = Dimensions.get('window');

interface PremiumPaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({ visible, onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [isProcessing, setIsProcessing] = useState(false);
    const { isPremium, purchasePlan, restore, monthlyPackage, yearlyPackage, isExpoGo } =
        useSubscription();

    const handleSubscribe = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsProcessing(true);
        try {
            const success = await purchasePlan(selectedPlan);
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Alhamdulillah!',
                    isExpoGo
                        ? 'Simulasi Pembelian Berhasil! (Mode Expo Go Preview). Fitur Premium aktif untuk akun Anda.'
                        : 'Fitur Premium berhasil diaktifkan untuk akun Anda selama masa percobaan 1 minggu gratis.',
                    [{ text: 'Mulai Menikmati', onPress: onClose }]
                );
            } else {
                Alert.alert('Informasi', 'Transaksi dibatalkan atau belum dapat diproses.');
            }
        } catch (e: any) {
            Alert.alert('Gagal', 'Terjadi kendala saat memproses pembelian. Silakan coba kembali.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsProcessing(true);
        try {
            const success = await restore();
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Sukses', 'Status langganan Premium Anda berhasil dipulihkan!', [
                    { text: 'Lanjutkan', onPress: onClose },
                ]);
            } else {
                Alert.alert('Informasi', 'Tidak ditemukan riwayat langganan aktif untuk akun ini.');
            }
        } catch {
            Alert.alert('Gagal', 'Gagal memulihkan pembelian. Periksa koneksi internet Anda.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Background ambient gradient */}
                <LinearGradient
                    colors={['#0F2E2B', '#091514', '#000000']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                />

                <SafeAreaView style={styles.safeArea}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={60} tint="dark" style={styles.closeBlur}>
                            <Ionicons name="close" size={20} color="#FFFFFF" />
                        </BlurView>
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Hero Image Section */}
                        <View style={styles.heroSection}>
                            <View style={styles.heroImageWrapper}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }}
                                    style={styles.heroImage}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(9, 21, 20, 0.95)', '#000000']}
                                    style={styles.heroGradient}
                                />
                            </View>

                            <Text style={styles.title}>Buka Premium</Text>
                            <Text style={styles.subtitle}>
                                Tingkatkan pengalaman mendengarkan Al-Qur'an dengan Premium
                            </Text>
                        </View>

                        {/* Feature Grid 2x3 */}
                        <View style={styles.featureGridCard}>
                            <View style={styles.featureGridRow}>
                                <View style={styles.featureItem}>
                                    <Ionicons name="pulse" size={26} color="#FFFFFF" />
                                    <Text style={styles.featureText}>Suara latar</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="arrow-down-circle-outline" size={26} color="#FFFFFF" />
                                    <Text style={styles.featureText}>Semua surah{'\n'}dapat diunduh</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.arabicIcon}>ق</Text>
                                    <Text style={styles.featureText}>Lirik Al-Qur'an{'\n'}& Tafsir</Text>
                                </View>
                            </View>

                            <View style={[styles.featureGridRow, { marginTop: Spacing.xl }]}>
                                <View style={styles.featureItem}>
                                    <Ionicons name="radio-outline" size={26} color="#FFFFFF" />
                                    <Text style={styles.featureText}>AirPlay & CarPlay</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="options-outline" size={26} color="#FFFFFF" />
                                    <Text style={styles.featureText}>Kontrol audio di{'\n'}luar aplikasi</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="bar-chart-outline" size={26} color="#FFFFFF" />
                                    <Text style={styles.featureText}>Wawasan & Tren</Text>
                                </View>
                            </View>
                        </View>

                        {/* Dukung Kami Section */}
                        <View style={styles.supportCard}>
                            <View style={styles.supportHeader}>
                                <Text style={styles.heartIcon}>❤️</Text>
                                <Text style={styles.supportTitle}>Dukung kami</Text>
                            </View>
                            <Text style={styles.supportDesc}>
                                Setiap langganan membantu kami menjaga QuranFlow tetap bebas iklan, menambahkan lebih banyak qari, dan membangun aplikasi terbaik untuk Muslim di seluruh dunia.
                            </Text>

                            {/* Plan Selection Row */}
                            <View style={styles.plansRow}>
                                {/* Monthly */}
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedPlan === 'monthly' && styles.planCardActive,
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedPlan('monthly');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.planName}>Bulanan</Text>
                                    <Text style={styles.planPrice}>
                                        {monthlyPackage?.product.priceString || 'Rp 39ribu'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Yearly (Recommended) */}
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedPlan === 'yearly' && styles.planCardActive,
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedPlan('yearly');
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>HEMAT 36%</Text>
                                    </View>
                                    <Text style={styles.planName}>Tahunan</Text>
                                    <Text style={styles.planPrice}>
                                        {yearlyPackage?.product.priceString || 'Rp 299ribu'}
                                    </Text>
                                    <Text style={styles.planSubprice}>(Rp24.900/bulan)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footnote & CTA */}
                        <View style={styles.ctaSection}>
                            <View style={styles.guaranteeRow}>
                                <Ionicons name="checkmark" size={16} color="#10B981" />
                                <Text style={styles.guaranteeText}>Tidak ada pembayaran saat ini</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.ctaButton, isProcessing && { opacity: 0.7 }]}
                                onPress={handleSubscribe}
                                disabled={isProcessing}
                                activeOpacity={0.85}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <Text style={styles.ctaButtonText}>
                                        {selectedPlan === 'yearly'
                                            ? 'Coba gratis 1 minggu'
                                            : 'Mulai Langganan Bulanan'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.footnote}>
                                {selectedPlan === 'yearly'
                                    ? `1 minggu Gratis, lalu ${yearlyPackage?.product.priceString || 'Rp 299ribu'}/tahun`
                                    : `${monthlyPackage?.product.priceString || 'Rp 39ribu'}/bulan, perpanjangan otomatis`}
                            </Text>

                            {/* Restore Purchases & Legal Section (Mandatory for App Store Review) */}
                            <View style={styles.legalSection}>
                                <TouchableOpacity
                                    onPress={handleRestore}
                                    disabled={isProcessing}
                                    style={styles.restoreBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.restoreText}>
                                        Pulihkan Pembelian (Restore)
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.legalRow}>
                                    <TouchableOpacity
                                        onPress={openTermsOfService}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.legalLink}>Syarat Layanan</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.legalDivider}>•</Text>
                                    <TouchableOpacity
                                        onPress={openPrivacyPolicy}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.legalLink}>Kebijakan Privasi</Text>
                                    </TouchableOpacity>
                                </View>

                                {isExpoGo && (
                                    <View style={styles.expoNotice}>
                                        <Ionicons
                                            name="information-circle-outline"
                                            size={13}
                                            color="#FBBF24"
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={styles.expoNoticeText}>
                                            Mode Simulasi (Expo Go). Pembayaran nyata aktif di Development Build.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    safeArea: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 16 : 24,
        left: 20,
        zIndex: 10,
    },
    closeBlur: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        marginTop: 10,
    },
    heroImageWrapper: {
        width: width * 0.72,
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.75)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    featureGridCard: {
        marginHorizontal: 20,
        marginTop: 24,
        padding: 22,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    featureGridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    arabicIcon: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: Typography.fontFamily.quran,
    },
    featureText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
        lineHeight: 16,
    },
    supportCard: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    supportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    heartIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    supportTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    supportDesc: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 19,
        marginBottom: 16,
    },
    plansRow: {
        flexDirection: 'row',
        gap: 12,
    },
    planCard: {
        flex: 1,
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1.5,
        borderColor: 'transparent',
        position: 'relative',
    },
    planCardActive: {
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    discountBadge: {
        position: 'absolute',
        top: -10,
        right: 12,
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    planName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    planSubprice: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.55)',
        marginTop: 2,
    },
    ctaSection: {
        marginTop: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    guaranteeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    guaranteeText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    ctaButton: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    footnote: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 12,
        textAlign: 'center',
    },
    legalSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: 18,
    },
    restoreBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    restoreText: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    legalLink: {
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 11,
        paddingHorizontal: 6,
    },
    legalDivider: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
    },
    expoNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 0.5,
        borderColor: 'rgba(251, 191, 36, 0.25)',
    },
    expoNoticeText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '500',
    },
});
