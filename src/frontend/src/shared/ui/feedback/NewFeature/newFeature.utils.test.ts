import { describe, expect, it } from 'vitest'
import { compareMajorMinor, isFeatureCurrent, parseMajorMinor } from './newFeature.utils'

describe('parseMajorMinor', () => {
    it('reads major.minor from plain, patch and prefixed versions', () => {
        expect(parseMajorMinor('5.3')).toEqual({ major: 5, minor: 3 })
        expect(parseMajorMinor('5.3.1')).toEqual({ major: 5, minor: 3 })
        expect(parseMajorMinor('v5.10.0-SNAPSHOT')).toEqual({ major: 5, minor: 10 })
    })

    it('returns null without a major.minor pair', () => {
        expect(parseMajorMinor('latest')).toBeNull()
    })
})

describe('compareMajorMinor', () => {
    it('orders numerically, not lexically', () => {
        expect(['5.10', '5.3', '4.9'].sort(compareMajorMinor)).toEqual(['4.9', '5.3', '5.10'])
    })
})

describe('isFeatureCurrent', () => {
    it('shows on the introducing release and older backends', () => {
        expect(isFeatureCurrent('5.3', '5.3.2')).toBe(true)
        expect(isFeatureCurrent('5.3', '5.2')).toBe(true)
        expect(isFeatureCurrent('5.3', '4.9')).toBe(true)
    })

    it('hides from the next release on', () => {
        expect(isFeatureCurrent('5.3', '5.4')).toBe(false)
        expect(isFeatureCurrent('5.3', '5.10')).toBe(false)
        expect(isFeatureCurrent('5.3', '6.0')).toBe(false)
    })

    it('hides while the running version is unknown or unparseable', () => {
        expect(isFeatureCurrent('5.3', undefined)).toBe(false)
        expect(isFeatureCurrent('5.3', '')).toBe(false)
        expect(isFeatureCurrent('5.3', 'unknown')).toBe(false)
    })
})
