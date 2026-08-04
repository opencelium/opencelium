import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n/config/i18n'

export function I18nProvider({ children }) {
    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    )
}
