import { describe, expect, it } from 'vitest'
import { TUTORIAL_OVERRIDE_PATHS } from './tutorialData'

/**
 * The tutorial answers requests by URL, so an endpoint changing its path silently
 * turns the tutorial back into a view of real data — which is how this broke twice
 * during development, once by missing /connector/meta/all entirely.
 *
 * Pinned literally rather than read from the api source: this file is typechecked
 * with the app's tsconfig, which has no node types. If one of these endpoints moves,
 * this test fails and points at the three to re-check:
 *   connectorApi.getConnectors      -> /connector/all
 *   connectorApi.getConnectorsMeta  -> /connector/meta/all   (the browsable list)
 *   invokerApi.getInvokers          -> /invoker/all
 */
describe('workflow tutorial overrides', () => {
    it('covers the three lists the editor and its sidebar read', () => {
        expect(TUTORIAL_OVERRIDE_PATHS).toEqual([
            '/connector/all',
            '/connector/meta/all',
            '/invoker/all',
        ])
    })

    it('uses absolute paths, since matching is exact', () => {
        for (const path of TUTORIAL_OVERRIDE_PATHS) {
            expect(path.startsWith('/'), path).toBe(true)
            expect(path).not.toContain('?')
        }
    })
})
