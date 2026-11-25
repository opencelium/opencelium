import type { OverrideRequest } from '@shared/api/requestOverrides'
import type { ScheduleExecutionRun } from '@entities/schedule/model/types'
import type { TutorialRunScript } from './tutorialRunScript'

/**
 * A manual start, stored the way the backend keeps a finished execution: the schedule
 * gets a last success, and a debug-mode run leaves a log file the logs dialog can
 * open. The tree behind it is the last test run's script, or the sample graph's when
 * there was none — see getTutorialRunScript.
 */
type StoredRun = {
    executionId: number
    schedulerId: number
    connectionId: number
    startTime: number
    script: TutorialRunScript
}

let runs: StoredRun[] = []
/** Negative, like every other tutorial id, and apart from the schedules' -8001 range. */
let nextExecutionId = -7001

/** Sum of the methods' own durations, so the card's duration agrees with the log tree. */
const scriptDuration = (script: TutorialRunScript) =>
    script.logs.reduce((total, log) => total + (Number.parseInt(log.segment?.response?.duration ?? '', 10) || 0), 0)

/**
 * Records a run and returns what the schedule's `lastExecution.success` becomes. Logs
 * are stored only in debug mode, as on the server. `script` is null only if not even
 * the sample graph produced a run; the start then succeeds but leaves no log.
 */
export function recordTutorialRun(
    schedule: { schedulerId: number; connectionId: number; debugMode: boolean },
    script: TutorialRunScript | null,
): ScheduleExecutionRun {
    const executionId = nextExecutionId
    nextExecutionId -= 1
    const startTime = Date.now()
    const hasLog = schedule.debugMode && script !== null
    if (hasLog) {
        runs = [...runs, { executionId, schedulerId: schedule.schedulerId,
            connectionId: schedule.connectionId, startTime, script }]
    }
    return { startTime, taId: String(executionId), duration: script ? scriptDuration(script) : 0, hasLog }
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The server's `{yyyy-mm-dd}_{hh-mm}_{connectionId}_{s|f}_{executionId}.log`, see parseLogFileName. */
const fileName = (run: StoredRun) => {
    const date = new Date(run.startTime)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `_${pad(date.getHours())}-${pad(date.getMinutes())}_${run.connectionId}_s_${run.executionId}.log`
}

const findRun = (executionId: number) => runs.find(run => run.executionId === executionId)

export const isTutorialExecutionId = (id: number) => findRun(id) !== undefined

const EXECUTION_CHILDREN_PATH = /^\/execution\/log\/element\/(-\d+)\/children$/
const RAW_LOG_PATH = /^\/execution\/(-\d+)\/raw\/log$/
const ELEMENT_PATH = /^\/execution\/log\/element\//

/**
 * The logs dialog's requests for a stored run: the file list, the execution's
 * connector, the rows under it and their details, and the raw download. Declines
 * (`undefined`) whatever is not one of them.
 */
export function tutorialRunRequest({ path, method }: OverrideRequest): unknown {
    if (method !== 'GET') return undefined

    if (path.startsWith('/execution/log-files?')) {
        const params = new URLSearchParams(path.slice(path.indexOf('?') + 1))
        const schedulerId = Number(params.get('schedulerId'))
        // Every stored run succeeded, so the failure list is always empty.
        const result = params.get('status') === 's'
            ? runs.filter(run => run.schedulerId === schedulerId).map(fileName)
            : []
        return { result }
    }

    const executionChildren = EXECUTION_CHILDREN_PATH.exec(path)
    if (executionChildren) {
        const run = findRun(Number(executionChildren[1]))
        return run ? [run.script.connector] : undefined
    }

    const rawLog = RAW_LOG_PATH.exec(path)
    if (rawLog) {
        const run = findRun(Number(rawLog[1]))
        return run
            ? new Blob([run.script.logs.map(log => JSON.stringify(log)).join('\n')], { type: 'text/plain' })
            : undefined
    }

    // The rows under the connector carry the script's own ids, the same for every run
    // of one graph — so the newest run that has the path answers it.
    if (ELEMENT_PATH.test(path)) {
        const run = [...runs].reverse().find(stored => path in stored.script.overrides)
        return run?.script.overrides[path]
    }
    return undefined
}

/** Forgets every stored run, so a restarted tutorial opens with no logs. */
export function resetTutorialRuns(): void {
    runs = []
    nextExecutionId = -7001
}
