
export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface Qari {
    id: string;
    name: string;
    image?: any; // For local asset require
    urlParam: string;
}

export const QARIS: Qari[] = [
    {
        id: 'mishary',
        name: 'Mishary Al-Afasy',
        urlParam: 'mishaari_raashid_al_3afaasee',
    },
    {
        id: 'abdulbasit',
        name: 'Abdul Basit',
        urlParam: 'abdul_basit_murattal',
    },
    {
        id: 'saad',
        name: 'Saad Al-Ghamdi',
        urlParam: 'sa3d_al-ghaamidi',
    },
    {
        id: 'maher',
        name: 'Maher Al-Muaiqly',
        urlParam: 'maher_almu3aiqly',
    },
];

export const getAudioUrl = (qariId: string, surahNumber: number): string => {
    const qari = QARIS.find(q => q.id === qariId) || QARIS[0];
    const paddedNumber = surahNumber.toString().padStart(3, '0');
    return `https://download.quranicaudio.com/quran/${qari.urlParam}/${paddedNumber}.mp3`;
};

// ... existing exports ...

export interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean | any;
}

export interface SurahText {
    number: number;
    name: string;
    englishName: string;
    ayahs: Ayah[];
    edition: {
        identifier: string;
        language: string;
        name: string;
        englishName: string;
        format: string;
        type: string;
    };
}

export const fetchSurahs = async (): Promise<Surah[]> => {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching surahs:', error);
        return [];
    }
};

export const fetchSurahText = async (surahNumber: number): Promise<{ arabic: Ayah[], translation: Ayah[] }> => {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,id.indonesian`);
        const data = await response.json();
        if (data.status === 'OK' && data.data.length >= 2) {
            return {
                arabic: data.data[0].ayahs,
                translation: data.data[1].ayahs
            };
        }
        return { arabic: [], translation: [] };
    } catch (error) {
        console.error('Error fetching surah text:', error);
        return { arabic: [], translation: [] };
    }
};
