import { setRequestOverrides } from '@shared/api/requestOverrides'
import type { SimulatedTestRun, SimulatedTestRunFactory } from '@features/workflow/test-run/simulatedTestRun'
import { buildFromConnectorPayload } from '@features/workflow/api/connectionPayload'
import { buildTutorialRunScript, type TutorialRunScript } from './tutorialRunScript'
import { buildTutorialGraph } from './tutorialGraph'
import { TUTORIAL_STEPS } from './tutorialSteps'

/**
 * The script of the last test run, which a schedule's manual start replays as its
 * stored execution. The run factory is the only place the editor hands over the graph
 * it would save, so this is how the schedules see what the user built.
 */
let lastRunScript: TutorialRunScript | null = null

/**
 * The finished tutorial graph's run, for a start with no test run before it — a
 * `?tutorialStep=` link that skips that step, or a user who went straight to the
 * schedules. Built on first use: it is the whole scripted graph.
 */
let sampleRunScript: TutorialRunScript | null = null
const buildSampleRunScript = (): TutorialRunScript | null => {
    const graph = buildTutorialGraph(TUTORIAL_STEPS.length)
    return graph ? buildTutorialRunScript({ fromConnector: buildFromConnectorPayload(graph.nodes, graph.edges) }) : null
}

/** What a schedule's manual start replays: the user's last test run, else the sample. */
export const getTutorialRunScript = (): TutorialRunScript | null => {
    if (lastRunScript) return lastRunScript
    sampleRunScript ??= buildSampleRunScript()
    return sampleRunScript
}

export function resetLastTutorialRunScript(): void {
    lastRunScript = null
}

/**
 * How fast the invented backend "executes". Deliberately quicker than the paced
 * playback dwells on each step (see animationSpeed.ts), so the replay falls behind
 * exactly as it does on a real run — which is what puts the start node's "Jump to
 * live" control on screen and gives the pause/step controls a buffer to work through.
 * Slow enough that the run still reads as something happening rather than a burst.
 */
const LINE_INTERVAL_MS = 220

/**
 * The tutorial's stand-in backend. Plays the graph the user built as a clean,
 * successful run: every method completes, the loop goes round once per invented
 * customer, and the IF is seen taking both branches.
 *
 * Nothing leaves the browser. The log tree's own REST calls — a method's
 * request/response detail, a loop iteration the tree did not keep — are answered
 * through the same `requestOverrides` registry that already answers the connector
 * list, so opening a row shows a real body instead of a 404.
 */
export const createTutorialTestRun: SimulatedTestRunFactory = (payload): SimulatedTestRun | null => {
    const script = buildTutorialRunScript(payload)
    const { logs, overrides } = script
    // A graph with no elements would emit only its framing lines, which reads as a
    // run that did nothing — better to decline and let the editor say why.
    if (logs.length <= 3) return null
    setRequestOverrides(overrides)
    lastRunScript = script

    return {
        start: (emit) => {
            let index = 0
            const timer = setInterval(() => {
                if (index >= logs.length) {
                    clearInterval(timer)
                    return
                }
                emit(logs[index])
                index += 1
            }, LINE_INTERVAL_MS)
            return () => clearInterval(timer)
        },
    }
}
