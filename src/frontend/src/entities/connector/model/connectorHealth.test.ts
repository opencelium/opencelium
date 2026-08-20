import { describe, expect, it } from 'vitest'
import { isConnectorConnectionError } from './connectorHealth'

describe('isConnectorConnectionError', () => {
    it('flags the two states the backend reports a reachability failure with', () => {
        expect(isConnectorConnectionError('AUTH_FAILED')).toBe(true)
        expect(isConnectorConnectionError('DOWN')).toBe(true)
    })

    it('does not flag a healthy connector, nor one never checked', () => {
        // 'UNKNOWN' means no health check has run yet — offering a "fix the
        // connection" affordance there would be inventing a problem.
        expect(isConnectorConnectionError('UP')).toBe(false)
        expect(isConnectorConnectionError('UNKNOWN')).toBe(false)
        expect(isConnectorConnectionError(undefined)).toBe(false)
        expect(isConnectorConnectionError(null)).toBe(false)
    })
})
