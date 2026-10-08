import { OVERRIDE_UNAVAILABLE, type OverrideRequest } from '@shared/api/requestOverrides'
import type { Schedule, ScheduleWebhook } from '@entities/schedule/model/types'
import { isTutorialExecutionId, recordTutorialRun, resetTutorialRuns, tutorialRunRequest } from './tutorialScheduleRuns'
import { getTutorialRunScript } from './tutorialTestRun'

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
 *
 * Every write replaces the schedule rather than mutating it: what a GET returned is
 * now in the RTK Query cache, which freezes it.
 */
let schedules: Schedule[] = []
/** Counts down, so ids stay negative and distinct within a run. */
let nextId = -8001

const text = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback)

/** One schedule, as `/scheduler/all` would return it: never run, so no executions. */
const create = (body: unknown): Schedule => {
    const { title, cronExp, debugMode } = (body ?? {}) as Partial<Record<string, unknown>>
    const schedule: Schedule = {
        schedulerId: nextId,
        title: text(title, ''),
        cronExp: text(cronExp, ''),
        debugMode: debugMode === true,
        status: false,
        connection: { connectionId: TUTORIAL_CONNECTION_ID, title: TUTORIAL_CONNECTION_TITLE },
    }
    nextId -= 1
    schedules = [...schedules, schedule]
    return schedule
}

const find = (schedulerId: number) => schedules.find(schedule => schedule.schedulerId === schedulerId)

const replace = (schedulerId: number, patch: (schedule: Schedule) => Schedule) => {
    const current = find(schedulerId)
    if (!current) return OVERRIDE_UNAVAILABLE
    const next = patch(current)
    schedules = schedules.map(schedule => (schedule === current ? next : schedule))
    return next
}

/** The fields the debug switch and the cron editor send back; the rest stays as created. */
const update = (schedulerId: number, body: unknown) => {
    const { title, cronExp, debugMode } = (body ?? {}) as Partial<Record<string, unknown>>
    return replace(schedulerId, schedule => ({
        ...schedule,
        title: text(title, schedule.title),
        cronExp: text(cronExp, schedule.cronExp),
        debugMode: typeof debugMode === 'boolean' ? debugMode : schedule.debugMode,
    }))
}

/**
 * At most one webhook per schedule, so it borrows the schedule's id — which keeps it
 * negative and makes the delete below a lookup rather than a second counter. The url
 * has the server's dot-relative shape, see resolveWebhookUrl.
 */
const createWebhook = (schedulerId: number) => {
    const webhook: ScheduleWebhook = {
        webhookId: schedulerId,
        url: `./webhook/execute/tutorial${schedulerId}`,
    }
    const updated = replace(schedulerId, schedule => ({ ...schedule, webhook }))
    return updated === OVERRIDE_UNAVAILABLE ? updated : webhook
}

const deleteWebhook = (webhookId: number) => {
    const owner = schedules.find(schedule => schedule.webhook?.webhookId === webhookId)
    if (!owner) return undefined
    replace(owner.schedulerId, schedule => ({ ...schedule, webhook: undefined }))
    return {}
}

/**
 * A manual start finishes at once and successfully, so the card shows a last success
 * straight away — and, in debug mode, a "see logs" link into the run.
 */
const execute = (schedulerId: number) => {
    replace(schedulerId, schedule => ({
        ...schedule,
        lastExecution: {
            ...schedule.lastExecution,
            success: recordTutorialRun({ schedulerId, connectionId: schedule.connection.connectionId,
                debugMode: schedule.debugMode }, getTutorialRunScript()),
        },
    }))
    return {}
}

const remove = (schedulerId: number) => {
    schedules = schedules.filter(schedule => schedule.schedulerId !== schedulerId)
    return {}
}

/** `/scheduler/<id>`; the id is negative, hence the optional sign. */
const SCHEDULE_PATH = /^\/scheduler\/(-?\d+)$/
/** The webhook create is a GET keyed by the user, then the schedule. */
const WEBHOOK_CREATE_PATH = /^\/webhook\/url\/-?\d+\/(-?\d+)$/
const WEBHOOK_PATH = /^\/webhook\/(-?\d+)$/
const EXECUTE_PATH = /^\/scheduler\/execute\/(-?\d+)$/
const NOTIFICATIONS_PATH = /^\/scheduler\/(-?\d+)\/notification\/all$/
const ID_SEGMENT = /\/(-\d+)(?=\/|$)/g

const idIn = (pattern: RegExp, path: string) => {
    const match = pattern.exec(path)
    return match ? Number(match[1]) : null
}

/**
 * Whether a path names something only the tutorial has: its connection, or one of the
 * schedules created this run (whose webhooks share their ids). Only negative segments
 * are read, because real ids are positive — the user id in the webhook path among them.
 */
const isTutorialPath = (path: string) =>
    [...path.matchAll(ID_SEGMENT)].some(([, id]) => {
        const value = Number(id)
        return value === TUTORIAL_CONNECTION_ID || find(value) !== undefined || isTutorialExecutionId(value)
    })

/**
 * The scheduler half of the tutorial's invented backend. The card's everyday controls
 * are answered here — the list, the create behind Add, the delete, the manual play on
 * the status ring (with the logs of a debug-mode run, see tutorialScheduleRuns), the debug switch and cron editor (an update, and the GET the editor
 * opens on), and the webhook create and delete — so a user who explores past the step
 * they are on gets the real UI behaving, not an error toast about an id that does not
 * exist. The notifications dialog opens on an empty list.
 *
 * Anything else that names a tutorial id — adding a notification, preparing support
 * logs — is failed locally with `OVERRIDE_UNAVAILABLE`: the backend cannot know the
 * id, so letting it through only trades a clear "not in the tutorial" for its 404.
 *
 * A handler rather than entries in the override map because these paths carry ids and
 * most are writes, and because the list has to reflect them: the writes invalidate the
 * `Entity` tag, the panel refetches `/scheduler/all`, and the card updates exactly as
 * it would against a real server.
 *
 * Anything with no tutorial id falls through to the network, which is what `undefined`
 * means here.
 */
export const tutorialScheduleRequest = ({ path, method, body }: OverrideRequest): unknown => {
    if (path === '/scheduler/all') return method === 'GET' ? schedules : undefined
    if (path === '/scheduler') return method === 'POST' ? create(body) : undefined
    // The manual trigger on a card's status ring. Answered rather than declined: the
    // run it would start belongs to a connection that exists nowhere.
    const executed = idIn(EXECUTE_PATH, path)
    if (method === 'GET' && executed !== null) return find(executed) ? execute(executed) : {}

    const run = tutorialRunRequest({ path, method, body })
    if (run !== undefined) return run

    const schedulerId = idIn(SCHEDULE_PATH, path)
    if (schedulerId !== null && find(schedulerId)) {
        if (method === 'GET') return find(schedulerId)
        if (method === 'PUT') return update(schedulerId, body)
        if (method === 'DELETE') return remove(schedulerId)
    }

    const webhookFor = idIn(WEBHOOK_CREATE_PATH, path)
    if (method === 'GET' && webhookFor !== null && find(webhookFor)) return createWebhook(webhookFor)
    const webhookId = idIn(WEBHOOK_PATH, path)
    const deletedWebhook = method === 'DELETE' && webhookId !== null ? deleteWebhook(webhookId) : undefined
    if (deletedWebhook) return deletedWebhook

    const notificationsOf = idIn(NOTIFICATIONS_PATH, path)
    if (method === 'GET' && notificationsOf !== null && find(notificationsOf)) return []

    return isTutorialPath(path) ? OVERRIDE_UNAVAILABLE : undefined
}

/** Forgets what was created, so a restarted tutorial opens with an empty panel. */
export function resetTutorialSchedules(): void {
    resetTutorialRuns()
    schedules = []
    nextId = -8001
}
