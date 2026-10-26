import type { PlanStep } from './workflowPlan.schema.ts'

const INDENT = '  '
const LOOP_RE = /^for each\b/i
const LOOP_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Reads the plan the user reviewed: one step per line, two spaces of indentation per nesting level, an optional "- ". */
export function parsePlanText(text: string): PlanStep[] {
    const steps: PlanStep[] = []
    for (const line of text.split('\n')) {
        const content = line.trim().replace(/^[-*]\s*/, '').replace(/^\d+(\.\d+)*[.)]?\s+/, '')
        if (!content) continue
        const indent = line.length - line.trimStart().length
        const depth = Math.floor(indent / INDENT.length)
        // A line can only be one level deeper than the one above it; an over-indented line joins that level.
        const previous = steps.at(-1)
        steps.push({ text: content, depth: previous ? Math.min(depth, previous.depth + 1) : 0 })
    }
    return steps
}

type OpenLoop = { label: string; depth: number }

/**
 * Small models follow nesting reliably only when it is spelled out, so the reviewed plan is rewritten the way a
 * hand-written prompt that works reads: hierarchical numbers, every loop labelled, and an explicit line where it ends.
 */
export function renderPlanForBuild(steps: PlanStep[]): string {
    const lines: string[] = ['Plan (follow it exactly; a step numbered under another runs inside it):']
    const counters: number[] = []
    const openLoops: OpenLoop[] = []
    let nextLoop = 0

    const closeLoopsFrom = (depth: number) => {
        while (openLoops.length && (openLoops.at(-1)?.depth ?? -1) >= depth) {
            const loop = openLoops.pop()
            if (loop) lines.push(`${INDENT.repeat(loop.depth)}Loop ${loop.label} ends here.`)
        }
    }

    for (const step of steps) {
        closeLoopsFrom(step.depth)
        counters.length = step.depth + 1
        counters[step.depth] = (counters[step.depth] ?? 0) + 1
        const number = counters.map((count) => count ?? 1).join('.')
        let text = step.text
        if (LOOP_RE.test(text)) {
            const label = LOOP_LABELS[nextLoop % LOOP_LABELS.length] ?? 'X'
            nextLoop += 1
            openLoops.push({ label, depth: step.depth })
            text = `Loop ${label}: ${text}`
        }
        lines.push(`${INDENT.repeat(step.depth)}${number}. ${text}`)
    }
    closeLoopsFrom(0)
    return lines.join('\n')
}
