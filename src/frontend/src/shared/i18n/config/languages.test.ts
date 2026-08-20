import { describe, expect, it } from 'vitest'
import { normalizeLanguage } from './languages'

describe('normalizeLanguage', () => {
    it('accepts the codes the app itself writes', () => {
        expect(normalizeLanguage('en')).toBe('en')
        expect(normalizeLanguage('de')).toBe('de')
    })

    it('accepts the spellings older accounts hold', () => {
        expect(normalizeLanguage('eng')).toBe('en')
        expect(normalizeLanguage('deu')).toBe('de')
        expect(normalizeLanguage('ger')).toBe('de')
        expect(normalizeLanguage('EN')).toBe('en')
        expect(normalizeLanguage(' de ')).toBe('de')
        expect(normalizeLanguage('de-DE')).toBe('de')
        expect(normalizeLanguage('en_US')).toBe('en')
    })

    it('rejects anything without a bundled locale', () => {
        expect(normalizeLanguage('fr')).toBeNull()
        expect(normalizeLanguage('')).toBeNull()
        expect(normalizeLanguage('deutsch')).toBeNull()
        expect(normalizeLanguage(null)).toBeNull()
        expect(normalizeLanguage(undefined)).toBeNull()
        expect(normalizeLanguage(2)).toBeNull()
    })
})
