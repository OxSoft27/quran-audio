import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Qari, getAudioUrl } from '@/services/quranApi';
import { SurahItem } from '@/constants/surahsData';

export interface DownloadedItem {
    id: string; // `${qariId}_${surahNumber}`
    qariId: string;
    qariName: string;
    surahNumber: number;
    surahName: string;
    arabicName: string;
    fileUri: string;
    fileSize: number; // in bytes
    downloadedAt: number; // timestamp
}

export interface BatchProgress {
    current: number;
    total: number;
    qariId: string;
    currentSurahName: string;
}

interface DownloadContextType {
    downloadedItems: Record<string, DownloadedItem>;
    downloadingItems: Record<string, number>; // key -> percentage 0..100
    downloadedList: DownloadedItem[];
    totalStorageUsed: number;
    formattedStorageUsed: string;
    isBatchDownloading: boolean;
    batchProgress: BatchProgress | null;
    isSurahDownloaded: (qariId: string, surahNumber: number) => boolean;
    isSurahDownloading: (qariId: string, surahNumber: number) => boolean;
    getDownloadProgress: (qariId: string, surahNumber: number) => number;
    getLocalAudioUri: (qariId: string, surahNumber: number) => string | null;
    downloadSurah: (qari: Qari, surah: SurahItem) => Promise<boolean>;
    deleteDownloadedSurah: (qariId: string, surahNumber: number) => Promise<boolean>;
    downloadAllSurahsForQari: (qari: Qari, surahs: SurahItem[]) => Promise<void>;
    cancelBatchDownload: () => void;
}

const STORAGE_KEY = '@quran_offline_downloads';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}quran_offline/`;

const DownloadContext = createContext<DownloadContextType>({
    downloadedItems: {},
    downloadingItems: {},
    downloadedList: [],
    totalStorageUsed: 0,
    formattedStorageUsed: '0 MB',
    isBatchDownloading: false,
    batchProgress: null,
    isSurahDownloaded: () => false,
    isSurahDownloading: () => false,
    getDownloadProgress: () => 0,
    getLocalAudioUri: () => null,
    downloadSurah: async () => false,
    deleteDownloadedSurah: async () => false,
    downloadAllSurahsForQari: async () => {},
    cancelBatchDownload: () => {},
});

export const useDownload = () => useContext(DownloadContext);

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [downloadedItems, setDownloadedItems] = useState<Record<string, DownloadedItem>>({});
    const [downloadingItems, setDownloadingItems] = useState<Record<string, number>>({});
    const [isBatchDownloading, setIsBatchDownloading] = useState(false);
    const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

    const cancelBatchRef = useRef(false);
    const activeTasksRef = useRef<Record<string, FileSystem.DownloadResumable>>({});

    // Ensure download directory exists on startup
    useEffect(() => {
        const initDir = async () => {
            try {
                const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
                }
            } catch (e) {
                console.log('Error initializing download directory:', e);
            }
        };
        initDir();
    }, []);

    // Load persisted downloaded metadata
    useEffect(() => {
        const loadDownloaded = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed: Record<string, DownloadedItem> = JSON.parse(raw);
                    // Verify that files still exist on disk
                    const verified: Record<string, DownloadedItem> = {};
                    for (const key of Object.keys(parsed)) {
                        const item = parsed[key];
                        try {
                            const fileInfo = await FileSystem.getInfoAsync(item.fileUri);
                            if (fileInfo.exists) {
                                verified[key] = {
                                    ...item,
                                    fileSize: fileInfo.size || item.fileSize || 0,
                                };
                            }
                        } catch {
                            // File not accessible, skip
                        }
                    }
                    setDownloadedItems(verified);
                }
            } catch (e) {
                console.log('Error loading offline downloads:', e);
            }
        };
        loadDownloaded();
    }, []);

    // Save metadata whenever downloadedItems changes
    const saveDownloadedItems = async (items: Record<string, DownloadedItem>) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.log('Error saving offline downloads:', e);
        }
    };

    const getItemKey = (qariId: string, surahNumber: number) => `${qariId}_${surahNumber}`;

    const isSurahDownloaded = useCallback((qariId: string, surahNumber: number): boolean => {
        const key = getItemKey(qariId, surahNumber);
        return !!downloadedItems[key];
    }, [downloadedItems]);

    const isSurahDownloading = useCallback((qariId: string, surahNumber: number): boolean => {
        const key = getItemKey(qariId, surahNumber);
        return downloadingItems[key] !== undefined;
    }, [downloadingItems]);

    const getDownloadProgress = useCallback((qariId: string, surahNumber: number): number => {
        const key = getItemKey(qariId, surahNumber);
        return downloadingItems[key] || 0;
    }, [downloadingItems]);

    const getLocalAudioUri = useCallback((qariId: string, surahNumber: number): string | null => {
        const key = getItemKey(qariId, surahNumber);
        const item = downloadedItems[key];
        return item ? item.fileUri : null;
    }, [downloadedItems]);

    // Download a single surah
    const downloadSurah = useCallback(async (qari: Qari, surah: SurahItem): Promise<boolean> => {
        const key = getItemKey(qari.id, surah.number);

        if (downloadedItems[key]) {
            return true; // Already downloaded
        }

        if (downloadingItems[key] !== undefined) {
            return false; // Already downloading
        }

        try {
            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
            }

            const padded = surah.number.toString().padStart(3, '0');
            const fileUri = `${DOWNLOAD_DIR}${qari.id}_${padded}.mp3`;
            const remoteUrl = getAudioUrl(qari.id, surah.number);

            setDownloadingItems(prev => ({ ...prev, [key]: 0 }));

            const progressCallback = (progress: FileSystem.DownloadProgressData) => {
                const percent = progress.totalBytesExpectedToWrite > 0
                    ? Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100)
                    : 0;
                setDownloadingItems(prev => ({ ...prev, [key]: percent }));
            };

            const downloadTask = FileSystem.createDownloadResumable(
                remoteUrl,
                fileUri,
                {},
                progressCallback
            );

            activeTasksRef.current[key] = downloadTask;

            const result = await downloadTask.downloadAsync();

            delete activeTasksRef.current[key];

            if (result && result.uri) {
                const info = await FileSystem.getInfoAsync(result.uri);
                const newItem: DownloadedItem = {
                    id: key,
                    qariId: qari.id,
                    qariName: qari.name,
                    surahNumber: surah.number,
                    surahName: surah.englishName,
                    arabicName: surah.name,
                    fileUri: result.uri,
                    fileSize: info.exists ? (info.size || 0) : 0,
                    downloadedAt: Date.now(),
                };

                setDownloadedItems(prev => {
                    const updated = { ...prev, [key]: newItem };
                    saveDownloadedItems(updated);
                    return updated;
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Error downloading surah ${surah.number} for ${qari.name}:`, error);
            Alert.alert('Gagal Mengunduh', `Tidak dapat mengunduh Surah ${surah.englishName}. Periksa koneksi internet.`);
            return false;
        } finally {
            setDownloadingItems(prev => {
                const copy = { ...prev };
                delete copy[key];
                return copy;
            });
            delete activeTasksRef.current[key];
        }
    }, [downloadedItems, downloadingItems]);

    // Delete a downloaded surah
    const deleteDownloadedSurah = useCallback(async (qariId: string, surahNumber: number): Promise<boolean> => {
        const key = getItemKey(qariId, surahNumber);
        const item = downloadedItems[key];

        if (!item) return false;

        try {
            const info = await FileSystem.getInfoAsync(item.fileUri);
            if (info.exists) {
                await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
            }

            setDownloadedItems(prev => {
                const updated = { ...prev };
                delete updated[key];
                saveDownloadedItems(updated);
                return updated;
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return true;
        } catch (error) {
            console.error(`Error deleting downloaded surah ${surahNumber}:`, error);
            return false;
        }
    }, [downloadedItems]);

    // Batch download all surahs for a qari
    const downloadAllSurahsForQari = useCallback(async (qari: Qari, surahs: SurahItem[]) => {
        if (isBatchDownloading) return;

        setIsBatchDownloading(true);
        cancelBatchRef.current = false;

        const toDownload = surahs.filter(s => !downloadedItems[getItemKey(qari.id, s.number)]);

        if (toDownload.length === 0) {
            Alert.alert('Sudah Lengkap', `Semua surah untuk ${qari.name} sudah terunduh.`);
            setIsBatchDownloading(false);
            return;
        }

        let completed = 0;
        const total = toDownload.length;

        for (let i = 0; i < total; i++) {
            if (cancelBatchRef.current) break;

            const surah = toDownload[i];
            setBatchProgress({
                current: i + 1,
                total,
                qariId: qari.id,
                currentSurahName: surah.englishName,
            });

            const success = await downloadSurah(qari, surah);
            if (success) completed++;
        }

        setIsBatchDownloading(false);
        setBatchProgress(null);

        if (!cancelBatchRef.current) {
            Alert.alert(
                'Unduhan Selesai',
                `Berhasil mengunduh ${completed} dari ${total} surah untuk ${qari.name}. Siap didengarkan offline!`
            );
        }
    }, [isBatchDownloading, downloadedItems, downloadSurah]);

    const cancelBatchDownload = useCallback(() => {
        cancelBatchRef.current = true;
        // Cancel all active tasks
        Object.values(activeTasksRef.current).forEach(task => {
            try {
                task.cancelAsync();
            } catch (e) { }
        });
        activeTasksRef.current = {};
        setIsBatchDownloading(false);
        setBatchProgress(null);
        setDownloadingItems({});
    }, []);

    // Derived list and total size
    const downloadedList = Object.values(downloadedItems).sort((a, b) => {
        if (a.qariName === b.qariName) {
            return a.surahNumber - b.surahNumber;
        }
        return a.qariName.localeCompare(b.qariName);
    });

    const totalStorageUsed = downloadedList.reduce((acc, item) => acc + (item.fileSize || 0), 0);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) {
            return `${mb.toFixed(1)} MB`;
        }
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
    };

    const formattedStorageUsed = formatBytes(totalStorageUsed);

    return (
        <DownloadContext.Provider
            value={{
                downloadedItems,
                downloadingItems,
                downloadedList,
                totalStorageUsed,
                formattedStorageUsed,
                isBatchDownloading,
                batchProgress,
                isSurahDownloaded,
                isSurahDownloading,
                getDownloadProgress,
                getLocalAudioUri,
                downloadSurah,
                deleteDownloadedSurah,
                downloadAllSurahsForQari,
                cancelBatchDownload,
            }}
        >
            {children}
        </DownloadContext.Provider>
    );
};
