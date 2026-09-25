import { useEffect } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useAuth } from '@features/auth/useAuth'
import { normalizeLanguage } from '@shared/i18n/config/languages'
import { storeLanguage } from '@shared/i18n/config/languageStorage'

/**
 * Applies the language stored on the account (`userDetail.lang`, part of the
 * login/refresh user response) once a session is hydrated — so login, reload and
 * a cross-tab session update all land on the user's own preference rather than
 * whatever this device last used.
 */
export function UserLanguageSync() {
    const { user, isAuthenticated } = useAuth()
    const { lang, setLang } = useI18n('common')
    const accountLang = normalizeLanguage(user?.userDetail?.lang)

    useEffect(() => {
        if (!isAuthenticated || !accountLang || accountLang === lang) return
        void setLang(accountLang)
        storeLanguage(accountLang)
    }, [isAuthenticated, accountLang, lang, setLang])

    return null
}
