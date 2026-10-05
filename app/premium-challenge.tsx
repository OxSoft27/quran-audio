import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Linking,
    Share,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function PremiumChallengeScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedIg, setCopiedIg] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState(false);

    const OFFICIAL_EMAIL = 'support@quranflow.app';
    const OFFICIAL_IG = '@quranflow.app';
    const SAMPLE_CAPTION = `Mendengarkan lantunan Al-Qur'an yang menenangkan hati bersama @quranflow.app 📖✨\n\nJadikan hari lebih damai dengan tilawah para qari terbaik dunia. Unduh QuranFlow dan dengarkan sekarang! #QuranFlow #AlQuran #DengarQuran`;

    const handleCopy = async (text: string, type: 'email' | 'ig' | 'caption') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Clipboard.setStringAsync(text);
        if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else if (type === 'ig') {
            setCopiedIg(true);
            setTimeout(() => setCopiedIg(false), 2000);
        } else if (type === 'caption') {
            setCopiedCaption(true);
            setTimeout(() => setCopiedCaption(false), 2000);
        }
    };

    const handleOpenEmail = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const subject = encodeURIComponent('Klaim Hadiah Tantangan Premium QuranFlow');
        const body = encodeURIComponent(
            'Halo Tim QuranFlow,\n\nSaya ingin mengklaim hadiah Tantangan Premium Gratis:\n- Akun Medsos: \n- Tautan Postingan: \n- Jumlah Tayangan (Views): \n\n(Mohon lampirkan tangkapan layar bukti analitik postingan Anda)\n\nTerima kasih!'
        );
        const mailUrl = `mailto:${OFFICIAL_EMAIL}?subject=${subject}&body=${body}`;
        try {
            await Linking.openURL(mailUrl);
        } catch {
            Alert.alert('Gagal Membuka Email', `Silakan kirim email manual ke: ${OFFICIAL_EMAIL}`);
        }
    };

    const handleOpenInstagram = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const appUrl = 'instagram://user?username=quranflow.app';
        const webUrl = 'https://instagram.com/quranflow.app';
        try {
            const canOpen = await Linking.canOpenURL(appUrl);
            if (canOpen) {
                await Linking.openURL(appUrl);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch {
            await Linking.openURL(webUrl);
        }
    };

    const handleShareApp = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.share({
                message: `Dengarkan lantunan ayat suci Al-Qur'an dari puluhan qari internasional terbaik di aplikasi QuranFlow: https://quranflow.app`,
                title: 'QuranFlow - Audio Al-Qur\'an',
            });
        } catch (error) {
            console.warn('Share error:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#090A0E' : '#F8F9FA' }]}>
            {/* Top Sheet Drag Indicator */}
            <View style={styles.dragIndicatorWrap}>
                <View style={[styles.dragIndicator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }]} />
            </View>

            {/* Top Navigation Bar with Blur Close Button */}
            <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
                <TouchableOpacity
                    style={[
                        styles.closeButton,
                        {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                    ]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel="Tutup"
                >
                    <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
                </TouchableOpacity>

                <View style={styles.badgeTopWrap}>
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badgeTop}
                    >
                        <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeTopText}>TANTANGAN RESMI</Text>
                    </LinearGradient>
                </View>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Tantangan Premium Gratis
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#4B5563' }]}>
                        Syiarkan ayat suci Al-Qur'an di media sosial Anda. Dapatkan akses keanggotaan Premium penuh secara cuma-cuma sebagai bentuk terima kasih kami.
                    </Text>

                    {/* Quick highlights pills */}
                    <View style={styles.pillsRow}>
                        <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                            <Text style={[styles.pillText, { color: '#10B981' }]}>100% Gratis</Text>
                        </View>
                        <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                            <Ionicons name="trophy" size={13} color="#F59E0B" />
                            <Text style={[styles.pillText, { color: '#F59E0B' }]}>Hingga 1 Tahun</Text>
                        </View>
                        <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
                            <Ionicons name="people" size={13} color="#3B82F6" />
                            <Text style={[styles.pillText, { color: '#3B82F6' }]}>Semua Pengguna</Text>
                        </View>
                    </View>
                </View>

                {/* Section 1: Cara Ikutan (3 Langkah Mudah) */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="compass-outline" size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        3 Langkah Mudah Berpartisipasi
                    </Text>
                </View>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    {/* Step 1 */}
                    <View style={styles.stepItem}>
                        <View style={[styles.stepIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="play" size={16} color="#10B981" />
                        </View>
                        <View style={styles.stepTextWrap}>
                            <Text style={[styles.stepTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                1. Dengarkan & Rekam Konten
                            </Text>
                            <Text style={[styles.stepDesc, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280' }]}>
                                Buka QuranFlow, putar surah atau qari favorit Anda. Rekam video pendek (Reels, TikTok, Shorts) atau tangkapan layar bertema lantunan tilawah harian.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]} />

                    {/* Step 2 */}
                    <View style={styles.stepItem}>
                        <View style={[styles.stepIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="share-social" size={16} color="#3B82F6" />
                        </View>
                        <View style={styles.stepTextWrap}>
                            <Text style={[styles.stepTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                2. Unggah & Tag @quranflow.app
                            </Text>
                            <Text style={[styles.stepDesc, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280' }]}>
                                Posting di media sosial Anda. Pastikan menandai akun resmi <Text style={{ fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>@quranflow.app</Text> dan gunakan tagar <Text style={{ color: '#10B981' }}>#QuranFlow</Text>.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]} />

                    {/* Step 3 */}
                    <View style={styles.stepItem}>
                        <View style={[styles.stepIconWrap, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                            <Ionicons name="gift" size={16} color="#F59E0B" />
                        </View>
                        <View style={styles.stepTextWrap}>
                            <Text style={[styles.stepTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                3. Raih Tayangan & Klaim
                            </Text>
                            <Text style={[styles.stepDesc, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280' }]}>
                                Begitu tayangan postingan Anda mencapai milestone tertentu, kirimkan tangkapan layar analitik kepada kami untuk aktivasi Premium instan.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section 2: Tingkatan Hadiah (Reward Tiers) */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Tingkatan Hadiah Sesuai Tayangan
                    </Text>
                </View>

                <View style={styles.tiersContainer}>
                    {/* Tier 1: 1k views */}
                    <View
                        style={[
                            styles.tierCard,
                            {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            },
                        ]}
                    >
                        <View style={styles.tierHeader}>
                            <View style={styles.tierLeft}>
                                <View style={[styles.tierBadge, { backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.12)' }]}>
                                    <Text style={[styles.tierBadgeText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                                        1K TAYANGAN
                                    </Text>
                                </View>
                                <Text style={[styles.tierReward, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                    1 Bulan Gratis
                                </Text>
                            </View>
                            <View style={[styles.tierDurationPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6' }]}>
                                <Ionicons name="calendar-outline" size={14} color={isDark ? '#E5E7EB' : '#374151'} />
                                <Text style={[styles.tierDurationText, { color: isDark ? '#E5E7EB' : '#374151' }]}>30 Hari</Text>
                            </View>
                        </View>
                        <Text style={[styles.tierBenefits, { color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#6B7280' }]}>
                            Akses ke seluruh qari premium, unduhan offline tanpa batas, dan audio berkualitas tinggi.
                        </Text>
                    </View>

                    {/* Tier 2: 5k views (Featured) */}
                    <View
                        style={[
                            styles.tierCard,
                            styles.tierCardFeatured,
                            {
                                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.04)',
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.4)',
                            },
                        ]}
                    >
                        <View style={styles.featuredRibbon}>
                            <Text style={styles.featuredRibbonText}>PALING POPULER</Text>
                        </View>
                        <View style={styles.tierHeader}>
                            <View style={styles.tierLeft}>
                                <View style={[styles.tierBadge, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
                                    <Text style={[styles.tierBadgeText, { color: '#F59E0B' }]}>
                                        5K TAYANGAN
                                    </Text>
                                </View>
                                <Text style={[styles.tierReward, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                    3 Bulan Gratis
                                </Text>
                            </View>
                            <View style={[styles.tierDurationPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Ionicons name="star" size={13} color="#F59E0B" />
                                <Text style={[styles.tierDurationText, { color: '#F59E0B', fontWeight: '700' }]}>90 Hari</Text>
                            </View>
                        </View>
                        <Text style={[styles.tierBenefits, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280' }]}>
                            Nikmati perjalanan ibadah mendengarkan Al-Qur'an secara intensif tanpa batas selama satu musim penuh.
                        </Text>
                    </View>

                    {/* Tier 3: 10k views */}
                    <View
                        style={[
                            styles.tierCard,
                            {
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.35)',
                            },
                        ]}
                    >
                        <View style={styles.tierHeader}>
                            <View style={styles.tierLeft}>
                                <View style={[styles.tierBadge, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                                    <Text style={[styles.tierBadgeText, { color: '#10B981' }]}>
                                        10K+ TAYANGAN
                                    </Text>
                                </View>
                                <Text style={[styles.tierReward, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                    1 Tahun Penuh Gratis
                                </Text>
                            </View>
                            <View style={[styles.tierDurationPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="ribbon" size={14} color="#10B981" />
                                <Text style={[styles.tierDurationText, { color: '#10B981', fontWeight: '700' }]}>365 Hari</Text>
                            </View>
                        </View>
                        <Text style={[styles.tierBenefits, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#6B7280' }]}>
                            Akses keanggotaan VIP tahunan tanpa batas untuk seluruh qari, playlist tematik, dan fitur eksklusif mendatang.
                        </Text>
                    </View>
                </View>

                {/* Section 3: Cara Klaim Hadiah */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="paper-plane-outline" size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Cara Klaim Hadiah Anda
                    </Text>
                </View>

                <Text style={[styles.claimHelperText, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#4B5563' }]}>
                    Kirimkan tangkapan layar bukti postingan dan analitik tayangan Anda, beserta tautan langsung postingan via salah satu saluran resmi di bawah ini:
                </Text>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    {/* Email Row */}
                    <View style={styles.contactRow}>
                        <View style={[styles.contactIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="mail" size={18} color="#3B82F6" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7280' }]}>
                                Email Dukungan
                            </Text>
                            <Text style={[styles.contactValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                {OFFICIAL_EMAIL}
                            </Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity
                                style={[styles.actionChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6' }]}
                                onPress={() => handleCopy(OFFICIAL_EMAIL, 'email')}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={copiedEmail ? 'checkmark' : 'copy-outline'}
                                    size={14}
                                    color={copiedEmail ? '#10B981' : isDark ? '#FFFFFF' : '#374151'}
                                />
                                <Text style={[styles.actionChipText, { color: copiedEmail ? '#10B981' : isDark ? '#FFFFFF' : '#374151' }]}>
                                    {copiedEmail ? 'Tersalin' : 'Salin'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionChipIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}
                                onPress={handleOpenEmail}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="open-outline" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]} />

                    {/* Instagram Row */}
                    <View style={styles.contactRow}>
                        <View style={[styles.contactIconWrap, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)' }]}>
                            <Ionicons name="logo-instagram" size={18} color="#EC4899" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7280' }]}>
                                Instagram Resmi
                            </Text>
                            <Text style={[styles.contactValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                {OFFICIAL_IG}
                            </Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity
                                style={[styles.actionChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6' }]}
                                onPress={() => handleCopy(OFFICIAL_IG, 'ig')}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={copiedIg ? 'checkmark' : 'copy-outline'}
                                    size={14}
                                    color={copiedIg ? '#10B981' : isDark ? '#FFFFFF' : '#374151'}
                                />
                                <Text style={[styles.actionChipText, { color: copiedIg ? '#10B981' : isDark ? '#FFFFFF' : '#374151' }]}>
                                    {copiedIg ? 'Tersalin' : 'Salin'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionChipIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}
                                onPress={handleOpenInstagram}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="open-outline" size={16} color="#EC4899" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Section 4: Pengingat Ringan & Etika */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="heart-outline" size={18} color="#EC4899" />
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Pengingat Ringan & Ketulusan
                    </Text>
                </View>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <View style={styles.reminderItem}>
                        <View style={styles.reminderEmojiWrap}>
                            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                        </View>
                        <Text style={[styles.reminderText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#374151' }]}>
                            <Text style={{ fontWeight: '700' }}>Akun Publik: </Text>
                            Akun media sosial dan postingan Anda harus berstatus publik agar tim kurator kami dapat melihat dan memverifikasi analitik tayangan.
                        </Text>
                    </View>

                    <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]} />

                    <View style={styles.reminderItem}>
                        <View style={styles.reminderEmojiWrap}>
                            <Ionicons name="sparkles-outline" size={18} color="#F59E0B" />
                        </View>
                        <Text style={[styles.reminderText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#374151' }]}>
                            <Text style={{ fontWeight: '700' }}>Ketulusan Niat: </Text>
                            Ketulusan lebih berharga daripada kesempurnaan. Buatlah konten sederhana dan jujur tentang bagaimana Al-Qur'an menemani hari-hari Anda.
                        </Text>
                    </View>

                    <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]} />

                    <View style={styles.reminderItem}>
                        <View style={styles.reminderEmojiWrap}>
                            <Ionicons name="leaf-outline" size={18} color="#10B981" />
                        </View>
                        <Text style={[styles.reminderText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#374151' }]}>
                            <Text style={{ fontWeight: '700' }}>Pahala Jariyah: </Text>
                            Semoga Allah SWT memberkahi setiap langkah kebaikan Anda. Setiap ayat yang didengar orang lain dari postingan Anda insyaAllah menjadi amal jariyah yang tak putus.
                        </Text>
                    </View>
                </View>

                {/* Section 5: Mulai Perjalananmu Banner Card */}
                <View
                    style={[
                        styles.inspirationCard,
                        {
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                        },
                    ]}
                >
                    <Ionicons name="heart" size={20} color="#10B981" style={{ marginRight: 12, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.inspirationTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            Mulai Perjalanan Kebaikanmu Hari Ini
                        </Text>
                        <Text style={[styles.inspirationText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#4B5563' }]}>
                            Jadikan Al-Qur'an teman setia di setiap langkah. Mulai dengarkan hari ini, bagikan pengalamanmu, dan jadilah inspirasi bagi sesama untuk kembali dekat dengan Kitabullah.
                        </Text>
                    </View>
                </View>

                {/* Interactive Action Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleShareApp}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryButtonGradient}
                        >
                            <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.primaryButtonText}>Bagikan Tautan QuranFlow</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            {
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                            },
                        ]}
                        onPress={() => handleCopy(SAMPLE_CAPTION, 'caption')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={copiedCaption ? 'checkmark' : 'copy-outline'}
                            size={16}
                            color={copiedCaption ? '#10B981' : isDark ? '#FFFFFF' : '#111827'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.secondaryButtonText, { color: copiedCaption ? '#10B981' : isDark ? '#FFFFFF' : '#111827' }]}>
                            {copiedCaption ? 'Template Caption Tersalin!' : 'Salin Template Caption Postingan'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dragIndicatorWrap: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 8,
    },
    dragIndicator: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeTopWrap: {
        alignItems: 'center',
    },
    badgeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    badgeTopText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Spacing.sm,
    },
    heroSection: {
        marginBottom: Spacing.xl,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: Spacing.md,
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 0.5,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.sm + 4,
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    card: {
        borderRadius: 20,
        borderWidth: 0.5,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepTextWrap: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 3,
    },
    stepDesc: {
        fontSize: 13,
        lineHeight: 19,
    },
    stepDivider: {
        height: 0.5,
        marginVertical: Spacing.md,
    },
    tiersContainer: {
        gap: 12,
        marginBottom: Spacing.lg,
    },
    tierCard: {
        borderRadius: 20,
        borderWidth: 0.5,
        padding: Spacing.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    tierCardFeatured: {
        borderWidth: 1,
    },
    featuredRibbon: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderBottomLeftRadius: 12,
    },
    featuredRibbonText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    tierLeft: {
        flex: 1,
    },
    tierBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: 6,
        marginBottom: 6,
    },
    tierBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    tierReward: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    tierDurationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    tierDurationText: {
        fontSize: 11,
        fontWeight: '600',
    },
    tierBenefits: {
        fontSize: 12.5,
        lineHeight: 18,
    },
    claimHelperText: {
        fontSize: 13.5,
        lineHeight: 20,
        marginBottom: Spacing.sm + 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contactIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    contactInfo: {
        flex: 1,
        marginRight: 10,
    },
    contactLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 13.5,
        fontWeight: '700',
    },
    contactActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    actionChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionChipIcon: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    reminderEmojiWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 1,
    },
    reminderText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
    inspirationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 20,
        borderWidth: 0.5,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    inspirationTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    inspirationText: {
        fontSize: 12.5,
        lineHeight: 18,
    },
    buttonGroup: {
        gap: 10,
        marginBottom: Spacing.lg,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 0.5,
    },
    secondaryButtonText: {
        fontSize: 13.5,
        fontWeight: '600',
    },
});
