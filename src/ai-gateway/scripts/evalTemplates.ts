// Rebuilds stored templates from their descriptions and scores each result against the original: operations, where
// each call sits (loops / ifs), fields set, and validation errors. The template being rebuilt is hidden from every
// example source (whole templates, operation usages, scripts), so it measures generation, not copying.
// Usage: node scripts/evalTemplates.ts [--limit N] [--ids id1,id2] [--skip id1,id2] [--templates on|off|both] [--out file]
// Needs Ollama with the workflow and embedding models; runs the gateway in-process, one request at a time.
import { appendFile, mkdir, readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { parseArgs } from 'node:util'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { WorkflowDsl } from '../src/dsl/workflowDsl.schema.ts'
import { type WorkflowScore, type WorkflowShape, dslShape, scoreWorkflow, templateShape } from '../src/eval/scoreWorkflow.ts'
import { type OperationUsages, createOperationUsages } from '../src/examples/operationUsages.ts'
import { type ScriptExamples, createScriptExamples } from '../src/examples/scriptExamples.ts'
import { type TemplateFlows, createTemplateFlows } from '../src/examples/templateFlows.ts'
import { parseTemplateFlow } from '../src/examples/templateFlow.ts'
import { createOperationRanker } from '../src/invokers/focusConnectors.ts'
import { createInvokerRepository } from '../src/invokers/invokerRepository.ts'
import { createOllamaClient } from '../src/llm/ollamaClient.ts'
import { createOllamaEmbedder } from '../src/llm/ollamaEmbedder.ts'

const { values: args } = parseArgs({ options: {
    limit: { type: 'string' }, ids: { type: 'string' }, skip: { type: 'string' }, templates: { type: 'string', default: 'both' }, out: { type: 'string' },
} })

// A template whose calls are mostly gone from the installed invokers cannot be rebuilt; it would only measure staleness.
const MIN_CURRENT_SHARE = 0.8

const config = loadConfig()
const invokers = createInvokerRepository(config.invokerDir)
const embedder = createOllamaEmbedder(config.ollamaUrl, config.embedModel)
const sources = {
    templates: createTemplateFlows(config.templateDir, embedder),
    operationUsages: createOperationUsages(config.templateDir, invokers, embedder),
    examples: createScriptExamples(config.templateDir, embedder),
}
await Promise.all([sources.templates.warmUp(), sources.operationUsages.warmUp(), sources.examples.warmUp()])

/** The example sources with one template taken out; each asks for a little more so the limit still fills. */
function without(templateId: string): { templates: TemplateFlows; operationUsages: OperationUsages; examples: ScriptExamples } {
    return {
        templates: { ...sources.templates, find: async (prompt, connectors, limit) =>
            (await sources.templates.find(prompt, connectors, limit + 1)).filter((flow) => flow.id !== templateId).slice(0, limit) },
        operationUsages: { ...sources.operationUsages, find: async (calls, perOperation) =>
            (await sources.operationUsages.find(calls, perOperation + 2))
                .map((found) => ({ ...found, usages: found.usages.filter((usage) => usage.templateId !== templateId).slice(0, perOperation) }))
                .filter((found) => found.usages.length > 0) },
        examples: { ...sources.examples, find: async (query, limit) =>
            (await sources.examples.find(query, limit + 2)).filter((example) => example.template !== templateId).slice(0, limit) },
    }
}

type Case = { id: string; name: string; prompt: string; from: string; to?: string; json: unknown }

async function loadCases(): Promise<Case[]> {
    const wanted = args.ids?.split(',').map((id) => id.trim())
    const files = (await readdir(config.templateDir)).filter((file) => file.endsWith('.json')).sort()
    const cases: Case[] = []
    for (const file of files) {
        const id = basename(file, '.json')
        if (wanted && !wanted.includes(id)) continue
        const json: unknown = JSON.parse(await readFile(join(config.templateDir, file), 'utf8'))
        const flow = parseTemplateFlow(id, json)
        const from = flow && await invokers.get(flow.systems.from)
        const to = flow?.systems.to ? await invokers.get(flow.systems.to) : null
        if (!flow?.description || !from || to === undefined) continue
        const calls = [...flow.operations.from.map((name) => from.operations.some((op) => op.name === name)),
            ...flow.operations.to.map((name) => Boolean(to?.operations.some((op) => op.name === name)))]
        if (calls.filter(Boolean).length < calls.length * MIN_CURRENT_SHARE) continue
        cases.push({ id, name: flow.name, prompt: flow.description, from: from.name, to: to?.name, json })
    }
    // --skip drops cases after --limit, so a resumed run covers the same templates as the interrupted one.
    const skipped = new Set(args.skip?.split(',').map((id) => id.trim()))
    return (args.limit ? cases.slice(0, Number(args.limit)) : cases).filter((testCase) => !skipped.has(testCase.id))
}

type Result = WorkflowScore & { id: string; name: string; useTemplates: boolean; errors: number; warnings: number
    durationMs: number; failure?: string; differences?: Differences }

/** What was missed and what was added, for reading a low score in the results file. */
type Differences = Record<'missingPlacements' | 'extraPlacements' | 'missingFields' | 'extraFields', string[]>

const minus = (left: Set<string>, right: Set<string>) => [...left].filter((item) => !right.has(item))

function differences(truth: WorkflowShape, generated: WorkflowShape): Differences {
    return {
        missingPlacements: minus(truth.placements, generated.placements), extraPlacements: minus(generated.placements, truth.placements),
        missingFields: minus(truth.fields, generated.fields), extraFields: minus(generated.fields, truth.fields),
    }
}

async function run(testCase: Case, useTemplates: boolean): Promise<Result> {
    const started = Date.now()
    const base = { id: testCase.id, name: testCase.name, useTemplates }
    const zero = { operationRecall: 0, operationPrecision: 0, placementRecall: 0, fieldRecall: 0, fieldPrecision: 0, errors: 0, warnings: 0 }
    const app = await buildApp({ config, llm: createOllamaClient(config.ollamaUrl, config.chatTimeoutMs), invokers,
        embedder, operationRanker: createOperationRanker(embedder), ...without(testCase.id) })
    try {
        const target = { prompt: testCase.prompt, from: testCase.from, to: testCase.to, useTemplates }
        const plan = await app.inject({ method: 'POST', url: '/workflow/plan', payload: target })
        if (plan.statusCode !== 200) return { ...base, ...zero, durationMs: Date.now() - started, failure: `plan: ${plan.body}` }
        const steps = (plan.json() as { steps: { text: string; depth: number }[] }).steps
        const planText = steps.map((step) => `${'  '.repeat(step.depth)}${step.text}`).join('\n')
        const built = await app.inject({ method: 'POST', url: '/workflow/generate', payload: { ...target, plan: planText } })
        if (built.statusCode !== 200) return { ...base, ...zero, durationMs: Date.now() - started, failure: `build: ${built.body}` }
        const { dsl, issues } = built.json() as { dsl: WorkflowDsl; issues: { severity: string }[] }
        const connectors = { from: (await invokers.get(testCase.from))!, to: testCase.to ? (await invokers.get(testCase.to)) ?? null : null }
        const truth = templateShape(testCase.json, connectors)
        const generated = dslShape(dsl)
        return {
            ...base,
            ...scoreWorkflow(truth, generated),
            differences: differences(truth, generated),
            errors: issues.filter((issue) => issue.severity === 'error').length,
            warnings: issues.filter((issue) => issue.severity === 'warning').length,
            durationMs: Date.now() - started,
        }
    } finally {
        await app.close()
    }
}

const percent = (value: number) => `${Math.round(value * 100)}%`.padStart(5)
const mean = (results: Result[], pick: (result: Result) => number) =>
    results.length ? results.reduce((sum, result) => sum + pick(result), 0) / results.length : 0

function summarize(label: string, results: Result[]) {
    const ok = results.filter((result) => !result.failure)
    console.log(`${label}: ${results.length} cases, ${results.length - ok.length} failed requests, `
        + `${ok.filter((result) => result.errors === 0).length} without errors`)
    console.log(`  operations recall ${percent(mean(results, (r) => r.operationRecall))}  precision ${percent(mean(results, (r) => r.operationPrecision))}`
        + `  placement ${percent(mean(results, (r) => r.placementRecall))}`
        + `  fields recall ${percent(mean(results, (r) => r.fieldRecall))}  precision ${percent(mean(results, (r) => r.fieldPrecision))}`
        + `  ${(mean(results, (r) => r.durationMs) / 1000).toFixed(0)} s per case`)
}

const modes = args.templates === 'both' ? [true, false] : [args.templates !== 'off']
const cases = await loadCases()
const out = args.out ?? join('eval-results', `templates-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`)
await mkdir(join(out, '..'), { recursive: true })
console.log(`${cases.length} templates, templates ${args.templates}; results go to ${out}`)

const results: Result[] = []
for (const testCase of cases) {
    for (const useTemplates of modes) {
        const result = await run(testCase, useTemplates)
        results.push(result)
        await appendFile(out, `${JSON.stringify(result)}\n`)
        console.log(`${useTemplates ? 'on ' : 'off'} ${testCase.name.slice(0, 50).padEnd(50)} ops ${percent(result.operationRecall)} `
            + `place ${percent(result.placementRecall)} fields ${percent(result.fieldRecall)} errors ${result.errors}`
            + `${result.failure ? `  FAILED ${result.failure.slice(0, 120)}` : ''}`)
    }
}
for (const useTemplates of modes) summarize(`templates ${useTemplates ? 'on' : 'off'}`, results.filter((r) => r.useTemplates === useTemplates))
