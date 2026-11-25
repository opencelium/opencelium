import { describe, expect, it } from 'vitest'
import {
    collectGlobalNames,
    buildGlobalReference,
    findGlobalReferences,
    GLOBAL_REFERENCE_TOKEN,
    isGlobalReference,
    parseGlobalReference,
} from './globalReference'

describe('globalReference', () => {
    it('finds plain and path references with their positions', () => {
        const text = '{{global.idoitUrl}}/api?t={{global.tenants[0].id}}&m={{global.limits.maxPerPage}}'
        expect(findGlobalReferences(text)).toEqual([
            { raw: '{{global.idoitUrl}}', name: 'idoitUrl', path: '', start: 0, end: 19 },
            { raw: '{{global.tenants[0].id}}', name: 'tenants', path: '[0].id', start: 26, end: 50 },
            { raw: '{{global.limits.maxPerPage}}', name: 'limits', path: '.maxPerPage', start: 53, end: 81 },
        ])
    })

    it('skips escaped references', () => {
        expect(findGlobalReferences(String.raw`\{{global.x}} and {{global.y}}`).map((r) => r.name)).toEqual(['y'])
    })

    it('rejects names that break the naming rule', () => {
        expect(findGlobalReferences('{{global.1abc}} {{global._x}} {{global.}}')).toEqual([])
        expect(isGlobalReference(`{{global.${'a'.repeat(65)}}}`)).toBe(false)
        expect(isGlobalReference(`{{global.${'a'.repeat(64)}}}`)).toBe(true)
    })

    it('does not treat aggregator placeholders or request data as globals', () => {
        expect(findGlobalReferences('{{42}} {{report.count}} {tenant} {#3.tenant}')).toEqual([])
    })

    it('parses a field that holds only a reference', () => {
        expect(parseGlobalReference(' {{global.tenants[1]}} ')).toEqual({ name: 'tenants', path: '[1]' })
        expect(parseGlobalReference('x {{global.tenants}}')).toBeNull()
    })

    it('builds a reference that parses back', () => {
        const built = buildGlobalReference('tenants', '[0].id')
        expect(built).toBe('{{global.tenants[0].id}}')
        expect(parseGlobalReference(built)).toEqual({ name: 'tenants', path: '[0].id' })
    })

    it('exposes a non-capturing token for split patterns', () => {
        const parts = 'a{{global.x}}b'.split(new RegExp(`(${GLOBAL_REFERENCE_TOKEN})`))
        expect(parts).toEqual(['a', '{{global.x}}', 'b'])
    })

    it('collects referenced names from nested data, once each and lower-cased', () => {
        const circular: Record<string, unknown> = {}
        circular.self = circular
        const nodes = [
            { data: { url: '/api?since={{global.lastSync}}', body: { a: '{{global.Tenants[0].id}}', b: String.raw`\{{global.escaped}}` } } },
            { data: { header: '{{global.lastsync}}', onClick: () => '{{global.fromFunction}}' } },
        ]
        expect(collectGlobalNames([nodes, circular, '{{global.extra}}'])).toEqual(['extra', 'lastsync', 'tenants'])
    })
})
