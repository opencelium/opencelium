import { describe, expect, it } from 'vitest'
import { resolveConnectorIcon } from './iconUrl'

describe('resolveConnectorIcon', () => {
    it('prefers the connector\'s own icon', () => {
        expect(resolveConnectorIcon({
            icon: './storage/connector.png',
            invoker: { icon: 'invoker.png' },
        })).toBe('./storage/connector.png')
    })

    it('falls back to the invoker icon when the connector has none', () => {
        expect(resolveConnectorIcon({ icon: null, invoker: { icon: 'invoker.png' } }))
            .toBe('invoker.png')
        expect(resolveConnectorIcon({ invoker: { icon: 'invoker.png' } }))
            .toBe('invoker.png')
    })

    it('treats a blank icon as missing', () => {
        expect(resolveConnectorIcon({ icon: '   ', invoker: { icon: 'invoker.png' } }))
            .toBe('invoker.png')
    })

    it('falls back when the icon is a freshly picked File', () => {
        const file = new File([''], 'pending.png')
        expect(resolveConnectorIcon({ icon: file, invoker: { icon: 'invoker.png' } }))
            .toBe('invoker.png')
    })

    it('accepts a looked-up invoker icon for shapes that carry only the invoker name', () => {
        const meta = { icon: null, invoker: { name: 'Jira' } }
        expect(resolveConnectorIcon(meta, 'jira.png')).toBe('jira.png')
        // The connector's own icon still wins over the looked-up one.
        expect(resolveConnectorIcon({ ...meta, icon: 'own.png' }, 'jira.png')).toBe('own.png')
    })

    it('returns null when nothing in the chain has an icon, leaving the default image to the renderer', () => {
        expect(resolveConnectorIcon({ icon: null, invoker: { icon: null } })).toBeNull()
        expect(resolveConnectorIcon({})).toBeNull()
        expect(resolveConnectorIcon({ invoker: null })).toBeNull()
        expect(resolveConnectorIcon({ invoker: { name: 'Jira' } }, null)).toBeNull()
    })
})
