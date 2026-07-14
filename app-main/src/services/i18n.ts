/**
 * i18n Configuration
 * Multi-language support for the app
 */

import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Translation files
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import sw from '../locales/sw.json';

// Create i18n instance
const i18n = new I18n({
    en,
    fr,
    es,
    sw,
});

// Set default locale
i18n.locale = Localization.locale.split('-')[0]; // Get language code (en, fr, etc.)
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;

// Helper function to change language
export const changeLanguage = (languageCode: string) => {
    i18n.locale = languageCode;
};

// Helper function to get current language
export const getCurrentLanguage = () => {
    return i18n.locale;
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
];
