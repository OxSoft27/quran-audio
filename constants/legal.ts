import * as WebBrowser from 'expo-web-browser';

/**
 * Legal URLs and helpers for App Store Review compliance (Guidelines 3.1.2 & 5.1.1)
 */
export const LEGAL_URLS = {
    // URL Privacy Policy dari Flycricket
    privacyPolicy: 'https://doc-hosting.flycricket.io/quranflow/40241d65-e474-401a-b012-eed4a91b44d3/privacy',
    // Standard Apple Licensed Application End User License Agreement (EULA)
    termsOfService: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};

/**
 * Open Privacy Policy in in-app Safari browser
 */
export async function openPrivacyPolicy(): Promise<void> {
    try {
        await WebBrowser.openBrowserAsync(LEGAL_URLS.privacyPolicy);
    } catch (error) {
        console.warn('Gagal membuka Privacy Policy:', error);
    }
}

/**
 * Open Terms of Service (EULA) in in-app Safari browser
 */
export async function openTermsOfService(): Promise<void> {
    try {
        await WebBrowser.openBrowserAsync(LEGAL_URLS.termsOfService);
    } catch (error) {
        console.warn('Gagal membuka Terms of Service:', error);
    }
}
