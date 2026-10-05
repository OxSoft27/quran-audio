import { QariAvatar } from '@/components/QariAvatar';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAudio } from '@/context/AudioContext';
import { QARIS, Qari, Surah, fetchSurahs, getAudioUrl } from '@/services/quranApi';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
    const { playSurah, currentTrack } = useAudio();
    const [query, setQuery] = useState('');
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedTab, setSelectedTab] = useState<'all' | 'surahs' | 'qaris'>('all');

    useEffect(() => {
        if (visible) {
            loadSurahs();
        }
    }, [visible]);

    const loadSurahs = async () => {
        const data = await fetchSurahs();
        setSurahs(data);
    };

    const trimmed = query.trim().toLowerCase();

    const filteredSurahs = surahs.filter((s) => {
        if (!trimmed) return true;
        return (
            s.name.toLowerCase().includes(trimmed) ||
            s.englishName.toLowerCase().includes(trimmed) ||
            s.englishNameTranslation.toLowerCase().includes(trimmed) ||
            s.number.toString() === trimmed
        );
    });

    const filteredQaris = QARIS.filter((q) => {
        if (!trimmed) return true;
        return (
            q.name.toLowerCase().includes(trimmed) ||
            (q.country && q.country.toLowerCase().includes(trimmed))
        );
    });

    const handlePlaySurah = (surah: Surah, qari?: Qari) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const targetQari = qari || QARIS[0];
        const url = getAudioUrl(targetQari.id, surah.number);
        playSurah(url, {
            surahName: surah.englishName,
            qariName: targetQari.name,
            surahNumber: surah.number,
            qariId: targetQari.id,
        });
        onClose();
    };

    const handleSelectQari = (qari: Qari) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Play Al-Fatihah by this Qari
        const url = getAudioUrl(qari.id, 1);
        playSurah(url, {
            surahName: 'Al-Fatihah',
            qariName: qari.name,
            surahNumber: 1,
            qariId: qari.id,
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Search Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Cari surah atau qari..."
                                placeholderTextColor="rgba(255, 255, 255, 0.45)"
                                value={query}
                                onChangeText={setQuery}
                                autoFocus={true}
                                clearButtonMode="while-editing"
                            />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Batal</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter Segmented Control */}
                    <View style={styles.segmentsRow}>
                        {(['all', 'surahs', 'qaris'] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.segmentBtn,
                                    selectedTab === tab && styles.segmentBtnActive,
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedTab(tab);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        selectedTab === tab && styles.segmentTextActive,
                                    ]}
                                >
                                    {tab === 'all' ? 'Semua' : tab === 'surahs' ? 'Surah' : 'Qari'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Results Content */}
                    <FlatList
                        data={selectedTab === 'qaris' ? [] : filteredSurahs}
                        keyExtractor={(item) => item.number.toString()}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            selectedTab !== 'surahs' && filteredQaris.length > 0 ? (
                                <View style={styles.qarisSection}>
                                    <Text style={styles.sectionHeader}>Qari ({filteredQaris.length})</Text>
                                    <FlatList
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={filteredQaris}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.qariList}
                                        renderItem={({ item }) => (
                                            <QariAvatar
                                                qari={item}
                                                onPress={() => handleSelectQari(item)}
                                            />
                                        )}
                                    />
                                    {selectedTab === 'all' && (
                                        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>
                                            Surah ({filteredSurahs.length})
                                        </Text>
                                    )}
                                </View>
                            ) : null
                        }
                        renderItem={({ item }) => {
                            const isCurrent = currentTrack?.surahNumber === item.number;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.surahItem,
                                        isCurrent && styles.surahItemActive,
                                    ]}
                                    onPress={() => handlePlaySurah(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.surahNumberCircle}>
                                        <Text style={styles.surahNumberText}>{item.number}</Text>
                                    </View>
                                    <View style={styles.surahInfo}>
                                        <Text style={styles.surahName}>{item.englishName}</Text>
                                        <Text style={styles.surahSub}>
                                            {item.englishNameTranslation} • {item.numberOfAyahs} Ayat
                                        </Text>
                                    </View>
                                    <Text style={styles.arabicName}>{item.name}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0C',
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.pagePadding,
        paddingTop: Platform.OS === 'ios' ? 12 : 20,
        paddingBottom: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 42,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
    },
    cancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    cancelText: {
        color: '#38BDF8',
        fontSize: 16,
        fontWeight: '500',
    },
    segmentsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.pagePadding,
        gap: 8,
        marginBottom: 12,
    },
    segmentBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    segmentBtnActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    segmentText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: Spacing.pagePadding,
        paddingBottom: 40,
    },
    qarisSection: {
        marginBottom: 8,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    qariList: {
        paddingVertical: 4,
    },
    surahItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    surahItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    surahNumberCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    surahNumberText: {
        color: '#FFFFFF',
        fontSize: Typography.size.footnote,
        fontWeight: Typography.weight.medium,
        fontFamily: Typography.fontFamily.primary,
        fontVariant: ['tabular-nums'],
    },
    surahInfo: {
        flex: 1,
    },
    surahName: {
        fontSize: Typography.size.subhead,
        fontWeight: Typography.weight.semibold,
        fontFamily: Typography.fontFamily.text,
        letterSpacing: Typography.tracking.subhead,
        color: '#FFFFFF',
    },
    surahSub: {
        fontSize: Typography.size.caption1,
        fontWeight: Typography.weight.regular,
        fontFamily: Typography.fontFamily.text,
        color: 'rgba(255, 255, 255, 0.55)',
        marginTop: 2,
    },
    arabicName: {
        fontSize: 20,
        color: '#FFFFFF',
        fontFamily: Typography.fontFamily.quran,
        lineHeight: 30,
    },
});
