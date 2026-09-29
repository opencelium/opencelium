import type { OverrideRequest } from '@shared/api/requestOverrides'
import type { Schedule } from '@entities/schedule/model/types'

/**
 * The connection the tutorial's schedules hang off. Negative, like the invented
 * connectors, so a request that escapes to the real backend is obvious rather than
 * quietly touching someone's data.
 */
export const TUTORIAL_CONNECTION_ID = -9000
const TUTORIAL_CONNECTION_TITLE = 'Tutorial workflow'

/**
 * Whatever the user has created this run. Module level because the thing it stands in
 * for — the server's scheduler table — is global too, and because the panel reads it
 * back through RTK Query rather than from a React value it could have been passed.
 */
let schedules: Schedule[] = []
/** Counts down, so ids stay negative and distinct within a run. */
let nextId = -8001

/** One schedule, as `/scheduler/all` would return it: never run, so no executions. */
const create = (body: unknown): Schedule => {
    const { title, cronExp, debugMode } = (body ?? {}) as Partial<Record<string, unknown>>
    const schedule: Schedule = {
        schedulerId: nextId,
        title: typeof title === 'string' ? title : '',
        cronExp: typeof cronExp === 'string' ? cronExp : '',
        debugMode: debugMode === true,
        status: false,
        connection: { connectionId: TUTORIAL_CONNECTION_ID, title: TUTORIAL_CONNECTION_TITLE },
    }
    nextId -= 1
    schedules = [...schedules, schedule]
    return schedule
}

const remove = (schedulerId: number) => {
    schedules = schedules.filter(schedule => schedule.schedulerId !== schedulerId)
    return {}
}

/** `/scheduler/<id>` for a delete; the id is negative, hence the optional sign. */
const SCHEDULE_PATH = /^\/scheduler\/(-?\d+)$/

/**
 * The scheduler half of the tutorial's invented backend. Everything the schedules
 * panel can reach is answered here — the list, the create behind Add, the delete on a
 * card, and the manual play on its status ring — so a user who explores past the step
 * they are on gets the real UI behaving, not an error toast about an id that does not
 * exist.
 *
 * A handler rather than entries in the override map because two of these paths carry
 * an id and two of them are writes, and because the list has to reflect the create:
 * `createEntity` invalidates the `Entity` tag, the panel refetches `/scheduler/all`,
 * and the card appears exactly as it would against a real server.
 *
 * Anything else falls through to the network, which is what `undefined` means here.
 */
export const tutorialScheduleRequest = ({ path, method, body }: OverrideRequest): unknown => {
    if (path === '/scheduler/all') return method === 'GET' ? schedules : undefined
    if (path === '/scheduler') return method === 'POST' ? create(body) : undefined
    // The manual trigger on a card's status ring. Answered rather than declined: the
    // run it would start belongs to a connection that exists nowhere.
    if (method === 'GET' && path.startsWith('/scheduler/execute/')) return {}
    if (method === 'DELETE') {
        const match = SCHEDULE_PATH.exec(path)
        if (match) return remove(Number(match[1]))
    }
    return undefined
}

/** Forgets what was created, so a restarted tutorial opens with an empty panel. */
export function resetTutorialSchedules(): void {
    schedules = []
    nextId = -8001
}
