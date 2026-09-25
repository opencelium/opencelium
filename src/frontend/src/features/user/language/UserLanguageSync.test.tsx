import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

let currentLang = 'en'
const setLang = vi.fn(async (next: string) => {
    currentLang = next
})
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key, lang: currentLang, setLang }),
}))

let auth: { user: unknown; isAuthenticated: boolean } = { user: null, isAuthenticated: false }
vi.mock('@features/auth/useAuth', () => ({
    useAuth: () => auth,
}))

const storeLanguage = vi.fn()
vi.mock('@shared/i18n/config/languageStorage', () => ({
    storeLanguage: (lang: string) => storeLanguage(lang),
}))

import { UserLanguageSync } from './UserLanguageSync'

const authenticatedWith = (lang: unknown) => ({
    isAuthenticated: true,
    user: { userDetail: { lang } },
})

beforeEach(() => {
    currentLang = 'en'
    auth = { user: null, isAuthenticated: false }
    setLang.mockClear()
    storeLanguage.mockClear()
})

describe('UserLanguageSync', () => {
    it('renders nothing', () => {
        const { container } = render(<UserLanguageSync />)
        expect(container).toBeEmptyDOMElement()
    })

    it('applies the account language once the session is hydrated', () => {
        auth = authenticatedWith('de')
        render(<UserLanguageSync />)
        expect(setLang).toHaveBeenCalledWith('de')
        expect(storeLanguage).toHaveBeenCalledWith('de')
    })

    it('accepts the legacy spellings stored on older accounts', () => {
        auth = authenticatedWith('de-DE')
        render(<UserLanguageSync />)
        expect(setLang).toHaveBeenCalledWith('de')
    })

    it('leaves the current language alone when the account holds no usable value', () => {
        auth = authenticatedWith('fr')
        render(<UserLanguageSync />)
        expect(setLang).not.toHaveBeenCalled()

        auth = authenticatedWith(null)
        render(<UserLanguageSync />)
        expect(setLang).not.toHaveBeenCalled()
    })

    it('does nothing while unauthenticated', () => {
        auth = { isAuthenticated: false, user: { userDetail: { lang: 'de' } } }
        render(<UserLanguageSync />)
        expect(setLang).not.toHaveBeenCalled()
    })

    it('does not re-apply a language that is already active', () => {
        currentLang = 'de'
        auth = authenticatedWith('de')
        render(<UserLanguageSync />)
        expect(setLang).not.toHaveBeenCalled()
    })
})
