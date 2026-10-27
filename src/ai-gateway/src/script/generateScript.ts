import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { checkScript, unescapeScriptCode } from '../dsl/checkScript.ts'
import { type ScriptExamples, formatScriptExamples } from '../examples/scriptExamples.ts'
import type { ChatMessage, LlmClient } from '../llm/llmClient.ts'

export const generateScriptRequestSchema = z.object({
    prompt: z.string().trim().min(1).max(2000),
    /** The request body field the script fills, e.g. `body.$.ConfigItem.InciState`. */
    target: z.string().trim().max(500).default(''),
    inputs: z.array(z.object({
        name: z.string().regex(/^VAR_\d+$/),
        /** Where the value comes from, e.g. `cmdb.objects.read › response body.$.result[i].title`. */
        source: z.string().max(500),
        /** A value the user tried in the playground, as written there. */
        sample: z.string().max(2000).optional(),
    })).max(20),
    /** The script in the editor, so "also trim it" refines it instead of starting over. */
    currentScript: z.string().max(20000).default(''),
})

export type GenerateScriptRequest = z.infer<typeof generateScriptRequestSchema>

const answerSchema = z.object({
    code: z.string().min(1),
    description: z.string(),
})

export type GenerateScriptResult = z.infer<typeof answerSchema> & {
    problems: string[]
    durationMs: number
    model: string
}

export type GenerateScriptDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
    examples: ScriptExamples
}

const EXAMPLE_COUNT = 2
const MAX_ATTEMPTS = 2
const answerFormat = toJsonSchema(answerSchema)

function buildMessage(request: GenerateScriptRequest, examples: string): string {
    const inputs = request.inputs.length
        ? request.inputs.map((input) => `- ${input.name}: ${input.source}${input.sample ? `\n  example value: ${input.sample}` : ''}`).join('\n')
        : '- (none)'
    const current = request.currentScript.trim()
    return `Write an OpenCelium transformation script.

Target field: ${request.target || '(not given)'}
Inputs:
${inputs}
${current ? `\nCurrent script (change it as asked; keep what the request does not mention):\n${current}\n` : ''}
Request: ${request.prompt}

Rules: assign the result to RESULT_VAR (it already exists: write RESULT_VAR = ..., never var RESULT_VAR); read inputs only as VAR_0..VAR_${Math.max(0, request.inputs.length - 1)}; it runs on
Nashorn, so ECMAScript 5.1 only (var and function; no let/const/arrow functions/template strings/includes/find).
A path ending in [] (or [i] inside a loop variable such as [i]) is one value per item; "result[]" alone is the whole list of items.
Answer with {"code":"...","description":"<one short sentence>"}.${examples ? `\n\nSimilar transformations already used in this installation:\n${examples}` : ''}`
}

/** One script for the transformation editor; problems left after a repair attempt are returned for the editor to show. */
export async function generateScript(request: GenerateScriptRequest, deps: GenerateScriptDeps): Promise<GenerateScriptResult> {
    const found = await deps.examples.find(`${request.target} = script: ${request.prompt}`, EXAMPLE_COUNT)
    const messages: ChatMessage[] = [{ role: 'user', content: buildMessage(request, found.length ? formatScriptExamples(found) : '') }]
    let durationMs = 0
    let best: { code: string; description: string; problems: string[] } | undefined

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const result = await deps.llm.chat({
            model: deps.model, messages, format: answerFormat, contextTokens: deps.contextTokens, temperature: attempt === 0 ? 0 : 0.4,
        })
        durationMs += result.durationMs
        let parsed: z.infer<typeof answerSchema> | undefined
        try {
            parsed = answerSchema.parse(JSON.parse(result.content))
        } catch {
            parsed = undefined
        }
        if (!parsed) continue
        parsed = { ...parsed, code: unescapeScriptCode(parsed.code) }
        const problems = checkScript(parsed.code, request.inputs.length)
        if (!best || problems.length < best.problems.length) best = { ...parsed, problems }
        if (problems.length === 0) break
        messages.push({ role: 'assistant', content: result.content },
            { role: 'user', content: `The script ${problems.join('; ')}. Return the corrected script.` })
    }
    if (!best) throw new Error('The model did not return a script')
    return { ...best, durationMs, model: deps.model }
}
