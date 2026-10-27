import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { Embedder } from '../llm/ollamaEmbedder.ts'
import { cosine } from './cosine.ts'
import { type TemplateFlow, type TemplateStep, parseTemplateFlow } from './templateFlow.ts'

export type TemplateFlows = {
    /** The stored templates closest to a request on these systems; empty when none is close or the index is unavailable. */
    find(prompt: string, connectors: WorkflowConnectors, limit: number): Promise<TemplateFlow[]>
    /** Builds the index ahead of the first request, so that request does not wait for the embeddings. */
    warmUp(): Promise<void>
}

// A template whose operations the request's systems don't have only shows a pattern; one that calls them shows the
// actual operations, nesting and fields to use, so coverage counts on top of similarity in meaning.
const COVERAGE_WEIGHT = 0.3
// Below this, a template is about something else; it is shown only if it calls this request's operations.
const MIN_SIMILARITY = 0.6
const MIN_SCORE = 0.8

/** Every template in `dir` that holds a workflow; unreadable files are skipped. */
export async function loadTemplateFlows(dir: string): Promise<TemplateFlow[]> {
    let files: string[]
    try {
        files = (await readdir(dir)).filter((file) => file.endsWith('.json'))
    } catch {
        return []
    }
    const flows: TemplateFlow[] = []
    for (const file of files) {
        try {
            const flow = parseTemplateFlow(basename(file, '.json'), JSON.parse(await readFile(join(dir, file), 'utf8')))
            if (flow) flows.push(flow)
        } catch {
            // A broken template is simply not offered as an example.
        }
    }
    return flows
}

const describe = (flow: TemplateFlow) => `${flow.name}. ${flow.description} (${flow.systems.from} to ${flow.systems.to})`

/** Share of the template's operations that the request's systems offer on the same side, so direction counts too. */
export function operationCoverage(flow: TemplateFlow, connectors: WorkflowConnectors): number {
    const names = (side: 'from' | 'to') => new Set((side === 'from' ? connectors.from : connectors.to)?.operations.map((op) => op.name))
    const sides = (['from', 'to'] as const).map((side) => ({ wanted: flow.operations[side], available: names(side) }))
    const total = sides.reduce((sum, side) => sum + side.wanted.length, 0)
    const covered = sides.reduce((sum, side) => sum + side.wanted.filter((name) => side.available.has(name)).length, 0)
    return total === 0 ? 0 : covered / total
}

/** Embeds name and description of every template once and keeps them in memory; failures mean "no examples". */
export function createTemplateFlows(dir: string, embedder: Embedder): TemplateFlows {
    let index: Promise<{ flow: TemplateFlow; vector: number[] }[]> | undefined
    const load = async () => {
        const flows = (await loadTemplateFlows(dir)).filter((flow) => flow.description || flow.steps.length > 1)
        if (flows.length === 0) return []
        const vectors = await embedder.embed(flows.map(describe))
        return flows.map((flow, position) => ({ flow, vector: vectors[position] ?? [] }))
    }
    const entries = async () => {
        try {
            return await (index ??= load())
        } catch (error) {
            index = undefined
            throw error
        }
    }
    return {
        async find(prompt, connectors, limit) {
            try {
                const all = await entries()
                if (all.length === 0) return []
                const systems = [connectors.from.name, connectors.to?.name].filter(Boolean).join(' to ')
                const [vector = []] = await embedder.embed([`${prompt} (${systems})`])
                return all
                    .map(({ flow, vector: own }) => {
                        const similarity = cosine(vector, own)
                        const coverage = operationCoverage(flow, connectors)
                        return { flow, similarity, coverage, score: similarity + COVERAGE_WEIGHT * coverage }
                    })
                    .filter(({ similarity, coverage, score }) => score >= MIN_SCORE && (coverage > 0 || similarity >= MIN_SIMILARITY))
                    .sort((left, right) => right.score - left.score)
                    .slice(0, limit)
                    .map(({ flow }) => flow)
            } catch {
                return []
            }
        },
        async warmUp() {
            await entries().catch(() => undefined)
        },
    }
}

export const noTemplateFlows: TemplateFlows = { find: async () => [], warmUp: async () => undefined }

/**
 * How a request uses the templates. A plan takes only their steps: shown a template's fields, the planner copies them
 * into the plan whether the request asks for them or not. A build fills fields, so it sees which source feeds which field.
 */
export type TemplateUse = 'plan' | 'build' | 'fill'

const TEMPLATE_USES: Record<TemplateUse, string> = {
    plan: `Follow their structure (order of reads, loops, conditions, create/update split) where the request is alike.`,
    build: `Follow their structure where the request is alike.`,
    fill: `The steps above stay as they are; take from the templates how loops, conditions and fields are filled where a
step is alike.`,
}

// Templates outlive invoker versions: an operation can be renamed or gone, and a model shown it will plan with it.
const UNAVAILABLE = '[not available]'

const FIELD_ADVICE = `
Of the fields a template sets, take over only those the request names and the ids or keys an operation cannot work
without (e.g. the id of the item to update or delete).`

/**
 * Templates show how this installation's integrators solve similar tasks. Small models copy structure readily, so they
 * are framed as a pattern to adapt: another system's steps carry that system's operation names, which must not leak in.
 */
export function describeTemplateExamples(flows: TemplateFlow[], use: TemplateUse, connectors: WorkflowConnectors): string {
    if (flows.length === 0) return ''
    const withFields = use !== 'plan'
    const available = new Set([connectors.from, connectors.to].flatMap((invoker) => invoker?.operations.map((op) => op.name) ?? []))
    return `Workflows already built in this installation for similar tasks. ${TEMPLATE_USES[use]}
Steps of another system use that system's operation names: use only the operations listed for this request. A call marked
${UNAVAILABLE} does not exist here; use the listed operation that does the same.${withFields ? FIELD_ADVICE : ''}
${formatTemplateFlows(flows, { withFields, available })}

`
}

type FormatOptions = { withFields: boolean; available?: ReadonlySet<string> }

const stepLine = (step: TemplateStep, available?: ReadonlySet<string>) => {
    const isMissing = step.operation !== undefined && available !== undefined && !available.has(step.operation)
    return `    ${'  '.repeat(step.depth)}${step.text}${isMissing ? ` ${UNAVAILABLE}` : ''}`
}

/** Each example as its purpose plus its flow; the systems are named so foreign operation names are not taken over. */
export function formatTemplateFlows(flows: TemplateFlow[], { withFields, available }: FormatOptions = { withFields: true }): string {
    return flows.map((flow) => {
        const systems = [flow.systems.from, flow.systems.to].filter(Boolean).join(' -> ')
        const purpose = flow.description ? `: ${flow.description}` : ''
        const rules = withFields && flow.fieldRules.length
            ? `\n  fields it sets:\n${flow.fieldRules.map((rule) => `    ${rule}`).join('\n')}` : ''
        return `Template "${flow.name}" (${systems})${purpose}\n  steps:\n${flow.steps.map((step) => stepLine(step, available)).join('\n')}${rules}`
    }).join('\n\n')
}
