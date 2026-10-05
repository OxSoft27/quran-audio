import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTheme } from '@/context/ThemeContext';
import { CityLocation, POPULAR_CITIES } from '@/constants/cities';

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocation: CityLocation;
    onSelectLocation: (location: CityLocation) => void;
    onRequestGps: () => Promise<void>;
    isGpsLoading?: boolean;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    currentLocation,
    onSelectLocation,
    onRequestGps,
    isGpsLoading = false,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');

    const trimmedQuery = searchQuery.trim().toLowerCase();

    const filteredCities = POPULAR_CITIES.filter((city) => {
        if (!trimmedQuery) return true;
        return (
            city.name.toLowerCase().includes(trimmedQuery) ||
            (city.province && city.province.toLowerCase().includes(trimmedQuery)) ||
            city.country.toLowerCase().includes(trimmedQuery)
        );
    });

    const handleSelectCity = (city: CityLocation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectLocation(city);
        onClose();
    };

    const handleGpsPress = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await onRequestGps();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <SafeAreaView style={[
                    styles.modalContainer,
                    { backgroundColor: isDark ? '#121215' : '#FFFFFF' }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#18181B' }]}>
                                Lokasi & Waktu Sholat
                            </Text>
                            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Pilih kota atau gunakan GPS untuk jadwal akurat
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[
                                styles.closeButton,
                                { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }
                            ]}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#18181B'} />
                        </TouchableOpacity>
                    </View>

                    {/* GPS Button */}
                    <TouchableOpacity
                        style={[
                            styles.gpsCard,
                            {
                                backgroundColor: isDark ? '#182422' : '#E6F4F1',
                                borderColor: isDark ? '#204A41' : '#B2DFD8',
                            }
                        ]}
                        onPress={handleGpsPress}
                        disabled={isGpsLoading}
                        activeOpacity={0.8}
                    >
                        <View style={styles.gpsIconContainer}>
                            {isGpsLoading ? (
                                <ActivityIndicator size="small" color="#10B981" />
                            ) : (
                                <Ionicons name="navigate-circle" size={28} color="#10B981" />
                            )}
                        </View>
                        <View style={styles.gpsTextContainer}>
                            <Text style={[styles.gpsTitle, { color: isDark ? '#E2F7F2' : '#0F5144' }]}>
                                Gunakan Lokasi GPS Saya
                            </Text>
                            <Text style={[styles.gpsSubtitle, { color: isDark ? '#7EBEB2' : '#2D7567' }]}>
                                Otomatis mendeteksi koordinat & waktu sholat setempat
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#10B981" />
                    </TouchableOpacity>

                    {/* Search Bar */}
                    <View style={[
                        styles.searchContainer,
                        {
                            backgroundColor: isDark ? '#1C1C22' : '#F3F4F6',
                            borderColor: isDark ? '#2E2E38' : '#E5E7EB',
                        }
                    ]}>
                        <Ionicons
                            name="search"
                            size={18}
                            color={isDark ? '#6B7280' : '#9CA3AF'}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#18181B' }]}
                            placeholder="Cari kota (Jakarta, Surabaya, Bandung...)"
                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* City List */}
                    <FlatList
                        data={filteredCities}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const isSelected =
                                currentLocation.id === item.id ||
                                (Math.abs(currentLocation.latitude - item.latitude) < 0.05 &&
                                    Math.abs(currentLocation.longitude - item.longitude) < 0.05);

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.cityItem,
                                        {
                                            backgroundColor: isSelected
                                                ? (isDark ? '#182E28' : '#EBF7F4')
                                                : (isDark ? '#18181C' : '#FAFAFA'),
                                            borderColor: isSelected
                                                ? '#10B981'
                                                : (isDark ? '#27272F' : '#F0F0F0'),
                                        }
                                    ]}
                                    onPress={() => handleSelectCity(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cityInfo}>
                                        <View style={styles.cityNameRow}>
                                            <Text style={[
                                                styles.cityName,
                                                { color: isDark ? '#FFFFFF' : '#18181B' },
                                                isSelected && { color: '#10B981', fontWeight: '700' }
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {item.isPopular && !isSelected && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularBadgeText}>Kota Utama</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.cityProvince, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            {item.province ? `${item.province}, ${item.country}` : item.country}
                                        </Text>
                                    </View>

                                    {isSelected ? (
                                        <View style={styles.selectedCircle}>
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        </View>
                                    ) : (
                                        <Ionicons
                                            name="location-outline"
                                            size={18}
                                            color={isDark ? '#52525B' : '#D1D5DB'}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {/* Footer Standards Info */}
                    <View style={[
                        styles.footer,
                        {
                            backgroundColor: isDark ? '#0D0D10' : '#F9FAFB',
                            borderTopColor: isDark ? '#222228' : '#E5E7EB',
                        }
                    ]}>
                        <Ionicons name="information-circle-outline" size={16} color="#10B981" />
                        <Text style={[styles.footerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Metode: <Text style={{ color: isDark ? '#E5E7EB' : '#374151', fontWeight: '600' }}>Kemenag RI</Text> (Subuh -20°, Isya -18°, +2m Ihtiyat)
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '82%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.size.title3,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: Typography.size.caption1,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gpsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
    },
    gpsIconContainer: {
        marginRight: Spacing.sm,
    },
    gpsTextContainer: {
        flex: 1,
    },
    gpsTitle: {
        fontSize: Typography.size.subhead,
        fontWeight: '700',
    },
    gpsSubtitle: {
        fontSize: Typography.size.caption2,
        marginTop: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: Spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.size.callout,
        height: '100%',
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    cityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 14,
        marginBottom: Spacing.xs,
        borderWidth: 1,
    },
    cityInfo: {
        flex: 1,
    },
    cityNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cityName: {
        fontSize: Typography.size.callout,
        fontWeight: '600',
    },
    cityProvince: {
        fontSize: Typography.size.caption1,
        marginTop: 2,
    },
    popularBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    popularBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },
    selectedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderTopWidth: 1,
        gap: 6,
    },
    footerText: {
        fontSize: Typography.size.caption2,
    },
});
