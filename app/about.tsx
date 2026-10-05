import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme === 'dark';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={[styles.header, { borderBottomColor: Colors[theme].border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: Colors[theme].text }]}>Tentang QuranFlow</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero App Card */}
                <View style={[styles.card, { backgroundColor: Colors[theme].card }]}>
                    <Image
                        source={require('@/assets/images/icon.png')}
                        style={styles.appIcon}
                    />
                    <Text style={[styles.appName, { color: Colors[theme].text }]}>QuranFlow</Text>
                    <Text style={[styles.version, { color: Colors[theme].subtitle }]}>Versi 1.0.0</Text>
                    
                    <Text style={[styles.description, { color: Colors[theme].text }]}>
                        QuranFlow didedikasikan untuk menghadirkan pengalaman mendengarkan dan merenungi lantunan suci Al-Qur'an dengan ketenangan hati dan keindahan estetika tanpa distraksi.
                    </Text>
                </View>

                {/* Nilai & Komitmen Kami */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: Colors[theme].subtitle }]}>KOMITMEN KAMI</Text>
                    
                    <View style={[styles.featureCard, { backgroundColor: Colors[theme].card }]}>
                        <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(29, 184, 181, 0.15)' : 'rgba(29, 184, 181, 0.1)' }]}>
                            <Ionicons name="headset-outline" size={20} color="#1DB8B5" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: Colors[theme].text }]}>Lantunan Qari Terbaik</Text>
                            <Text style={[styles.featureDesc, { color: Colors[theme].subtitle }]}>
                                Rekaman murottal jernih dari para qari terkemuka di dunia untuk memperdalam kekhusyukan tilawah Anda.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: Colors[theme].card }]}>
                        <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="leaf-outline" size={20} color="#10B981" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: Colors[theme].text }]}>Suasana Tenang & Damai</Text>
                            <Text style={[styles.featureDesc, { color: Colors[theme].subtitle }]}>
                                Dilengkapi perpaduan suara alam penyejuk batin yang dirancang khusus untuk menemani waktu relaksasi, tidur, dan tadabbur.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: Colors[theme].card }]}>
                        <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="sparkles-outline" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={[styles.featureTitle, { color: Colors[theme].text }]}>Desain Anggun & Khusyuk</Text>
                            <Text style={[styles.featureDesc, { color: Colors[theme].subtitle }]}>
                                Antarmuka modern yang sederhana, elegan, dan ramah pengguna agar ibadah harian Anda senantiasa nyaman.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer Note */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: Colors[theme].subtitle }]}>
                        Dikembangkan dengan sepenuh hati oleh Lunaris Dev.
                    </Text>
                    <Text style={[styles.footerDoa, { color: Colors[theme].subtitle }]}>
                        Semoga lantunan Al-Qur'an ini menjadi penyejuk hati dan amal jariyah bagi kita semua. Aamiin.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.pagePadding,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: Typography.size.title2,
        fontWeight: Typography.weight.bold,
    },
    content: {
        padding: Spacing.pagePadding,
        paddingBottom: 40,
    },
    card: {
        padding: Spacing.xl,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 18,
        marginBottom: Spacing.md,
    },
    appName: {
        fontSize: Typography.size.title2,
        fontWeight: Typography.weight.bold,
        marginBottom: 2,
    },
    version: {
        fontSize: Typography.size.footnote,
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: Typography.size.subhead,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.9,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.semibold,
        marginBottom: Spacing.md,
        letterSpacing: 0.8,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 14,
    },
    featureIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: Typography.size.body,
        fontWeight: Typography.weight.semibold,
        marginBottom: 3,
    },
    featureDesc: {
        fontSize: Typography.size.footnote,
        lineHeight: 18,
        opacity: 0.8,
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.medium,
        textAlign: 'center',
        marginBottom: 6,
    },
    footerDoa: {
        fontSize: Typography.size.caption1,
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.7,
    },
});
