import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, SafeAreaView, Alert, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useAudio } from '@/context/AudioContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { theme, mode, setMode } = useTheme();
    const { isAutoPlayEnabled, toggleAutoPlay } = useAudio();

    const toggleTheme = () => {
        // Cycle: system -> light -> dark -> system
        if (mode === 'system') setMode('light');
        else if (mode === 'light') setMode('dark');
        else setMode('system');
    };

    const Option = ({ label, value, onPress, isAction = false }: any) => (
        <TouchableOpacity style={[styles.option, { borderBottomColor: Colors[theme].border }]} onPress={onPress}>
            <Text style={[styles.optionLabel, { color: Colors[theme].text }]}>{label}</Text>
            <View style={styles.rightContainer}>
                <Text style={[styles.optionValue, { color: Colors[theme].subtitle }]}>{value}</Text>
                {isAction && <Ionicons name="chevron-forward" size={20} color={Colors[theme].subtitle} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors[theme].text }]}>Pengaturan</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: Colors[theme].subtitle }]}>TAMPILAN</Text>
                    <Option
                        label="Tema"
                        value={mode === 'system' ? 'Otomatis' : mode === 'light' ? 'Terang' : 'Gelap'}
                        onPress={toggleTheme}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: Colors[theme].subtitle }]}>AUDIO</Text>
                    <Option
                        label="Putar Otomatis"
                        value={
                            <Switch
                                value={isAutoPlayEnabled}
                                onValueChange={toggleAutoPlay}
                                trackColor={{ false: '#767577', true: Colors[theme].tint }}
                                thumbColor={Platform.OS === 'android' ? Colors[theme].card : '#f4f3f4'}
                            />
                        }
                        onPress={toggleAutoPlay}
                        isAction={false}
                    />
                    <Option
                        label="Kualitas Audio"
                        value="Tinggi"
                        onPress={() => { }}
                        isAction
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: Colors[theme].subtitle }]}>TENTANG</Text>
                    <Option
                        label="Versi Aplikasi"
                        value="1.0.0"
                        onPress={() => { }}
                    />
                    <Option
                        label="Developer"
                        value="Antigravity"
                        onPress={() => { }}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                    onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully')}
                >
                    <Text style={styles.buttonText}>Bersihkan Cache</Text>
                </TouchableOpacity>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    optionLabel: {
        fontSize: 16,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionValue: {
        fontSize: 16,
        marginRight: 8,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
