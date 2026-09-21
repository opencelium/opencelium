import { clearRequestOverrides, setRequestOverrides } from '@shared/api/requestOverrides'
import { store } from '@app/store/store'
import { baseApi } from '@shared/api/baseApi'
import { TUTORIAL_CONNECTORS, TUTORIAL_CONNECTORS_META, TUTORIAL_INVOKERS } from './tutorialFixtures'

/**
 * The three GETs the workflow editor and its sidebar read. `/connector/meta/all` is
 * the one that feeds the browsable connector list; `/connector/all` carries the
 * invoker operations behind a selection, and `/invoker/all` the icons.
 */
const OVERRIDES: Record<string, unknown> = {
    '/connector/all': TUTORIAL_CONNECTORS,
    '/connector/meta/all': TUTORIAL_CONNECTORS_META,
    '/invoker/all': TUTORIAL_INVOKERS,
}

/** Exported so a test can pin them to the endpoints that actually request them. */
export const TUTORIAL_OVERRIDE_PATHS = Object.keys(OVERRIDES)

/**
 * Answers those requests with the tutorial's invented systems, then drops the cached
 * real responses so the editor asks again and gets the fixtures.
 *
 * Overriding the request rather than seeding the cache is deliberate: `baseApi` sets
 * `refetchOnMountOrArgChange: true`, so anything written into the cache is revalidated
 * away the moment the editor mounts.
 */
export function seedTutorialData() {
    setRequestOverrides(OVERRIDES)
    invalidate()
}

/** Restores the real API and refetches, so the editor stops showing invented data. */
export function clearTutorialData() {
    clearRequestOverrides()
    invalidate()
}

/** `as never` matches the codebase's own tag casts — the union omits these string ids. */
function invalidate() {
    store.dispatch(baseApi.util.invalidateTags(
        Object.keys(OVERRIDES).map(id => ({ type: 'Entity', id })) as never,
    ))
}
