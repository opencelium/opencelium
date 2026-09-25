import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'
import { DEFAULT_LANGUAGE } from './languages'
import { readStoredLanguage } from './languageStorage'

i18n
    .use(initReactI18next)
    .init({
        resources,
        // Starts from the last language used on this device; a hydrated session
        // replaces it with the account's own preference (see UserLanguageSync).
        lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,

        ns: ['common', 'auth'],
        defaultNS: 'common',

        interpolation: {
            escapeValue: false,
        },
    })

export { i18n }
