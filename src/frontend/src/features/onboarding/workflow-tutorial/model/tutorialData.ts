import { message } from 'antd'
import {
    clearRequestOverrides,
    OVERRIDE_UNAVAILABLE,
    setRequestOverrideHandler,
    setRequestOverrides,
    type OverrideRequest,
} from '@shared/api/requestOverrides'
import { i18n } from '@shared/i18n/config/i18n'
import { store } from '@app/store/store'
import { baseApi } from '@shared/api/baseApi'
import { TUTORIAL_CONNECTORS, TUTORIAL_CONNECTORS_META, TUTORIAL_INVOKERS } from './tutorialFixtures'
import { resetTutorialSchedules, tutorialScheduleRequest } from './tutorialSchedules'
import { resetLastTutorialRunScript } from './tutorialTestRun'

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

/**
 * Answered by `tutorialScheduleRequest` rather than by the map above — it carries ids
 * and writes — but invalidated alongside it, so the panel re-reads the invented
 * scheduler instead of a cached real one.
 */
const SCHEDULE_LIST_PATH = '/scheduler/all'

/** Exported so a test can pin them to the endpoints that actually request them. */
export const TUTORIAL_OVERRIDE_PATHS = [...Object.keys(OVERRIDES), SCHEDULE_LIST_PATH]

/** Long enough to read the two sentences; antd's 3s default is gone mid-way. */
const UNAVAILABLE_DURATION_SEC = 8

/**
 * The handler's side effects, kept out of it so it stays a pure function of the
 * request.
 *
 * A manual start is a GET, which `generalRequest` deliberately does not invalidate
 * on: against a server the finished run arrives over the socket. The tutorial has no
 * socket, so the list is re-read here — after the current request settles, so the
 * refetch does not race the mutation that caused it.
 *
 * An unavailable action gets the only feedback the user sees, since `baseQuery` skips
 * the error bus for those.
 */
function scheduleRequest(request: OverrideRequest): unknown {
    const response = tutorialScheduleRequest(request)
    if (request.method === 'GET' && request.path.startsWith('/scheduler/execute/')) {
        queueMicrotask(() => invalidate([SCHEDULE_LIST_PATH]))
    }
    if (response === OVERRIDE_UNAVAILABLE) {
        message.info(
            i18n.getFixedT(i18n.language, 'onboarding')('workflow.sandbox.unavailable'),
            UNAVAILABLE_DURATION_SEC,
        )
    }
    return response
}

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
    resetTutorialSchedules()
    resetLastTutorialRunScript()
    setRequestOverrideHandler(scheduleRequest)
    invalidate()
}

/** Restores the real API and refetches, so the editor stops showing invented data. */
export function clearTutorialData() {
    clearRequestOverrides()
    resetTutorialSchedules()
    resetLastTutorialRunScript()
    invalidate()
}

/** `as never` matches the codebase's own tag casts — the union omits these string ids. */
function invalidate(paths: string[] = TUTORIAL_OVERRIDE_PATHS) {
    store.dispatch(baseApi.util.invalidateTags(
        paths.map(id => ({ type: 'Entity', id })) as never,
    ))
}
