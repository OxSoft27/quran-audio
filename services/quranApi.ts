
export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

import { ALL_SURAHS, SurahItem } from '@/constants/surahsData';

export interface Qari {
    id: string;
    name: string;
    image?: any; // For local asset require or { uri: string }
    urlParam: string;
    country?: string;
    specialty?: string[];
    isPopular?: boolean;
    initials?: string;
    availableSurahs?: number[]; // If undefined, full 114 surahs are available
}

export const QARIS: Qari[] = [
    // --- QARI TERPOPULER DI DUNIA (114 SURAT LENGKAP / 30 JUZ) ---
    {
        id: 'mishary',
        name: 'Mishary Rashid Al-Afasy',
        urlParam: 'mishaari_raashid_al_3afaasee',
        image: require('@/assets/images/qaris/mishary.png'),
        country: 'Kuwait',
        isPopular: true,
        specialty: ['Murattal', 'Nasheed'],
    },
    {
        id: 'sudais',
        name: 'Abdur-Rahman As-Sudais',
        urlParam: 'abdurrahmaan_as-sudays',
        image: require('@/assets/images/qaris/sudais.png'),
        country: 'Arab Saudi',
        isPopular: true,
        specialty: ['Imam Besar Masjidil Haram'],
    },
    {
        id: 'shuraim',
        name: "Sa'ud Ash-Shuraim",
        urlParam: 'sa3ood_al-shuraym',
        image: require('@/assets/images/qaris/shuraim.png'),
        country: 'Arab Saudi',
        isPopular: true,
        specialty: ['Mantan Imam Masjidil Haram'],
    },
    {
        id: 'maher',
        name: 'Maher Al-Muaiqly',
        urlParam: 'maher_256',
        image: require('@/assets/images/qaris/maher.png'),
        country: 'Arab Saudi',
        isPopular: true,
        specialty: ['Imam Masjidil Haram'],
    },
    {
        id: 'saad',
        name: 'Saad Al-Ghamdi',
        urlParam: 'sa3d_al-ghaamidi/complete',
        image: require('@/assets/images/qaris/saad.png'),
        country: 'Arab Saudi',
        isPopular: true,
        specialty: ['Murattal'],
    },
    {
        id: 'yasser_dosari',
        name: 'Yasser Al-Dosari',
        urlParam: 'yasser_ad-dussary',
        image: require('@/assets/images/qaris/yasser_dosari.png'),
        country: 'Arab Saudi',
        isPopular: true,
        specialty: ['Imam Masjidil Haram'],
    },
    {
        id: 'abdulbasit',
        name: 'Abdul Basit Abdul Samad',
        urlParam: 'abdul_basit_murattal',
        image: require('@/assets/images/qaris/abdulbasit.png'),
        country: 'Mesir',
        isPopular: true,
        specialty: ['Murattal', 'Mujawwad', 'Legenda Emas'],
    },
    {
        id: 'husary',
        name: 'Mahmoud Khalil Al-Husary',
        urlParam: 'mahmood_khaleel_al-husaree_iza3a',
        image: require('@/assets/images/qaris/husary.png'),
        country: 'Mesir',
        isPopular: true,
        specialty: ['Rujukan Tajwid Dunia', 'Murattal'],
    },
    {
        id: 'minshawi',
        name: 'Mohamed Siddiq Al-Minshawi',
        urlParam: 'muhammad_siddeeq_al-minshaawee',
        image: require('@/assets/images/qaris/minshawi.png'),
        country: 'Mesir',
        isPopular: true,
        specialty: ['Voice of Tears', 'Murattal', 'Mujawwad'],
    },
    {
        id: 'shatri',
        name: 'Abu Bakr Al-Shatri',
        urlParam: 'abu_bakr_ash-shaatree',
        image: require('@/assets/images/qaris/shatri.png'),
        country: 'Arab Saudi',
        specialty: ['Hafs an Asim'],
    },
    {
        id: 'ajmy',
        name: 'Ahmad Al-Ajmy',
        urlParam: 'ahmed_ibn_3ali_al-3ajamy',
        image: require('@/assets/images/qaris/ajmy.png'),
        country: 'Arab Saudi',
        specialty: ['Murattal'],
    },
    {
        id: 'hudhaify',
        name: 'Ali Al-Hudhaify',
        urlParam: 'huthayfi',
        image: require('@/assets/images/qaris/hudhaify.png'),
        country: 'Arab Saudi',
        specialty: ['Imam Masjid Nabawi', 'Tajwid'],
    },
    {
        id: 'juhani',
        name: 'Abdullah Awad Al-Juhani',
        urlParam: 'abdullaah_3awwaad_al-juhaynee',
        image: require('@/assets/images/qaris/juhani.png'),
        country: 'Arab Saudi',
        specialty: ['Imam Masjidil Haram'],
    },
    {
        id: 'baleela',
        name: 'Bandar Baleela',
        urlParam: 'bandar_baleela/complete',
        image: require('@/assets/images/qaris/baleela.png'),
        country: 'Arab Saudi',
        specialty: ['Imam Masjidil Haram'],
    },
    {
        id: 'ali_jaber',
        name: 'Abdullah Ali Jaber',
        urlParam: 'abdullaah_alee_jaabir_studio',
        image: require('@/assets/images/qaris/ali_jaber.png'),
        country: 'Arab Saudi',
        specialty: ['Alm. Imam Masjidil Haram'],
    },
    {
        id: 'tunaiji',
        name: 'Khalifah Al-Tunaiji',
        urlParam: 'khalifah_taniji',
        image: require('@/assets/images/qaris/tunaiji.png'),
        country: 'Uni Emirat Arab',
        specialty: ['Dewan Juri Internasional'],
    },
    {
        id: 'rifai',
        name: 'Hani Ar-Rifai',
        urlParam: 'rifai',
        image: require('@/assets/images/qaris/rifai.png'),
        country: 'Arab Saudi',
        specialty: ['Murattal'],
    },
    {
        id: 'ayyub',
        name: 'Muhammad Ayyub',
        urlParam: 'muhammad_ayyoob',
        image: require('@/assets/images/qaris/ayyub.png'),
        country: 'Arab Saudi',
        specialty: ['Alm. Imam Masjid Nabawi', 'Hijazi'],
    },
    {
        id: 'qatami',
        name: 'Nasser Al-Qatami',
        urlParam: 'nasser_bin_ali_alqatami',
        image: require('@/assets/images/qaris/qatami.png'),
        country: 'Arab Saudi',
        specialty: ['Riyadh'],
    },

    // --- QARI DENGAN REKAMAN SURAT TERPILIH (PARTIAL) ---
    {
        id: 'ahmed_kaseb',
        name: 'Ahmed Kaseb',
        urlParam: 'ahmed_kaseb',
        image: require('@/assets/images/qaris/ahmed_kaseb.png'),
        country: 'Mesir',
        availableSurahs: [1, 36, 55, 67, 78, 87, 93, 112, 113, 114],
        specialty: ['Surat Pilihan'],
    }
];

export const getQariSurahs = (qari: Qari): SurahItem[] => {
    if (!qari.availableSurahs || qari.availableSurahs.length === 0) {
        return ALL_SURAHS;
    }
    return ALL_SURAHS.filter(s => qari.availableSurahs!.includes(s.number));
};

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://api.alquran.cloud/v1/surah', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.warn('Failed or timed out fetching surahs, using local fallback:', error);
        return ALL_SURAHS.map((s) => ({
            number: s.number,
            name: s.name,
            englishName: s.englishName,
            englishNameTranslation: s.meaning || s.englishName,
            numberOfAyahs: s.numberOfAyahs,
            revelationType: s.revelationType,
        }));
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
