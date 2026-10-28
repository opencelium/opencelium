import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'

export const explainWorkflowRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    title: z.string().max(300).default(''),
    /** The workflow as indented lines: steps in order, nested under their loops and conditions, with the fields they set. */
    outline: z.string().trim().min(1).max(20_000),
})

export type ExplainWorkflowRequest = z.infer<typeof explainWorkflowRequestSchema>

const answerSchema = z.object({
    /** One or two sentences, the way the installation's templates are described. */
    description: z.string().min(1).max(600),
    /** What happens, step by step, in plain language. */
    explanation: z.array(z.string().min(1)).min(1).max(10),
})

export type WorkflowExplanation = z.infer<typeof answerSchema> & { durationMs: number; model: string }

export type ExplainWorkflowDeps = { llm: LlmClient; model: string; contextTokens: number }

const SYSTEM_PROMPT = `You describe OpenCelium integration workflows for the people who use them, not for developers.
"description": one or two sentences saying what the workflow does with which systems and records, in the style of
these examples:
- Reads hosts from Zabbix and creates or updates the matching hosts in CheckMK.
- Deletes config items in OTRS when they no longer exist in i-doit, identified by the object title.
- Reads clients from i-doit and creates or updates the corresponding config items in OTRS, including location and contact.
"explanation": what happens, in 3 to 8 short steps a non-developer follows: which records are read, how they are
matched, what is created or changed and when. Name systems and fields the way the outline does, never colors, step ids
or reference syntax. Describe only what the outline shows; do not guess at purposes it does not state.
Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

export async function explainWorkflow(request: ExplainWorkflowRequest, deps: ExplainWorkflowDeps): Promise<WorkflowExplanation> {
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `${request.title ? `Workflow "${request.title}":\n` : ''}${request.outline}\n\nAnswer in ${request.language === 'de' ? 'German' : 'English'}.` },
        ],
        format: answerFormat,
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable explanation')
    }
    const parsed = answerSchema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable explanation')
    return { ...parsed.data, description: parsed.data.description.trim(), durationMs: result.durationMs, model: deps.model }
}
