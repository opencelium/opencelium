import { setRequestOverrides } from '@shared/api/requestOverrides'
import type { SimulatedTestRun, SimulatedTestRunFactory } from '@features/workflow/test-run/simulatedTestRun'
import { buildTutorialRunScript } from './tutorialRunScript'

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
    const { logs, overrides } = buildTutorialRunScript(payload)
    // A graph with no elements would emit only its framing lines, which reads as a
    // run that did nothing — better to decline and let the editor say why.
    if (logs.length <= 3) return null
    setRequestOverrides(overrides)

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
