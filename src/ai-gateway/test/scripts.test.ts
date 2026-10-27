import { describe, expect, it } from 'vitest'
import { buildConstrainedSchema } from '../src/dsl/buildConstrainedSchema.ts'
import { checkScript, unescapeScriptCode } from '../src/dsl/checkScript.ts'
import { normalizeWorkflow } from '../src/dsl/normalizeWorkflow.ts'
import { validateWorkflow } from '../src/dsl/validateWorkflow.ts'
import type { FieldValue, WorkflowDsl } from '../src/dsl/workflowDsl.schema.ts'
import { connectors } from './fixtures.ts'

const mapPriority = "RESULT_VAR = 'Normal';\nif (VAR_0 == 'High') { RESULT_VAR = 'Urgent'; }"

const withTitle = (title: FieldValue): WorkflowDsl => ({
    steps: [
        { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
        { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [
            { id: 's3', kind: 'method', connector: 'to', operation: 'CreateTicket', params: [], fields: [{ name: 'title', value: title }] },
        ] },
    ],
})
const script = (code: string, inputs = [{ step: 's2', path: 'fields.priority.name' }]) =>
    ({ script: { inputs, code, description: 'Map the priority' } })

describe('checkScript', () => {
    it('accepts ES5 that assigns RESULT_VAR from its declared inputs', () => {
        expect(checkScript(mapPriority, 1)).toEqual([])
    })

    it.each([
        ['let x = VAR_0; RESULT_VAR = x;', /ECMAScript 5\.1/],
        ['RESULT_VAR = (() => VAR_0)();', /ECMAScript 5\.1/],
        ['var x = VAR_0;', /never assigns RESULT_VAR/],
        ['if (RESULT_VAR == VAR_0) {}', /never assigns RESULT_VAR/],
        ['RESULT_VAR = VAR_0 + VAR_2;', /uses VAR_2 but has only 1 input/],
    ])('%s', (code, problem) => {
        expect(checkScript(code, 1).join(' ')).toMatch(problem)
    })
})

describe('checkScript with the editor\'s Nashorn check', () => {
    it.each([
        ["RESULT_VAR = VAR_0.includes('x');", /uses VAR_0\.includes, which Nashorn \(ECMAScript 5\.1\) does not have \(line 1\)/],
        ['RESULT_VAR = VAR_0.find(function (item) { return item.id; });', /uses VAR_0\.find/],
        ['RESULT_VAR = Object.assign({}, VAR_0);', /uses Object\.assign/],
        ['var m = new Map(); RESULT_VAR = m;', /uses Map/],
        ['RESULT_VAR = `a${VAR_0}`;', /template string; join strings with \+/],
    ])('%s', (code, problem) => {
        expect(checkScript(code, 1).join(' ')).toMatch(problem)
    })

    it('allows what runs on the server: Java types and Date', () => {
        expect(checkScript("var Text = Java.type('java.lang.String'); RESULT_VAR = new Date().getTime() + VAR_0;", 1)).toEqual([])
    })
})

describe('script values', () => {
    it('are allowed for body fields and validated with their inputs', () => {
        const dsl = withTitle(script(mapPriority))
        expect(buildConstrainedSchema(connectors).safeParse(dsl).success).toBe(true)
        expect(validateWorkflow(dsl, connectors)).toEqual([])
    })

    it('report bad code and out-of-scope inputs as errors the model can repair', () => {
        const dsl = withTitle(script('const x = 1;', [{ step: 's9', path: 'x' }]))
        const messages = validateWorkflow(dsl, connectors).map((issue) => issue.message)
        expect(messages).toEqual(expect.arrayContaining([
            expect.stringMatching(/Field "title" script input VAR_0 refers to "s9"/),
            expect.stringMatching(/Field "title" script uses let or const; use var .*ECMAScript 5\.1/),
            expect.stringMatching(/Field "title" script never assigns RESULT_VAR/),
        ]))
    })

    it('are not allowed for URL params', () => {
        const dsl: WorkflowDsl = { steps: [{ id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', fields: [],
            params: [{ name: 'PROJECT', value: script(mapPriority, [{ step: 's0', path: 'x' }]) as never }] }] }
        expect(buildConstrainedSchema(connectors).safeParse(dsl).success).toBe(false)
    })

    it('have their inputs corrected like plain references', () => {
        const dsl: WorkflowDsl = {
            steps: [
                { id: 's1', kind: 'method', connector: 'from', operation: 'ListIssues', params: [], fields: [] },
                { id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' }, body: [] },
                { id: 's3', kind: 'loop', over: { step: 's2', path: '' }, body: [
                    { id: 's4', kind: 'method', connector: 'to', operation: 'CreateTicket', params: [],
                        fields: [{ name: 'title', value: script(mapPriority) }] },
                ] },
            ],
        }
        const loop = normalizeWorkflow(dsl).steps[2]
        const field = loop?.kind === 'loop' && loop.body[0]?.kind === 'method' ? loop.body[0].fields[0]?.value : undefined
        expect(field).toMatchObject({ script: { inputs: [{ step: 's3', path: 'fields.priority.name' }] } })
    })
})

describe('targeted script repair', () => {
    const broken = withTitle(script('RESULT_VAR = VAR_0 + VAR_1;'))
    const fixed = { inputs: [{ step: 's2', path: 'fields.priority.name' }, { step: 's2', path: 'key' }],
        code: 'RESULT_VAR = VAR_0 + VAR_1;', description: 'Join priority and key' }

    it('groups script errors per field and gives up when a non-script error is present', async () => {
        const { brokenScripts } = await import('../src/workflow/repairScripts.ts')
        expect(brokenScripts(validateWorkflow(broken, connectors))).toEqual([
            { stepId: 's3', field: 'title', problems: [expect.stringContaining('uses VAR_1')] },
        ])
        expect(brokenScripts([{ stepId: 's1', severity: 'error', message: 'Loop source refers to "s9"' }])).toBeUndefined()
    })

    it('repairs only the broken script instead of regenerating the workflow', async () => {
        const { generateWorkflow } = await import('../src/workflow/generateWorkflow.ts')
        const requests: { format: unknown; content: string }[] = []
        const answers = [JSON.stringify(broken), JSON.stringify(fixed)]
        const llm = {
            async chat(request: { format: Record<string, unknown>; messages: { content: string }[] }) {
                requests.push({ format: request.format, content: request.messages.at(-1)?.content ?? '' })
                return { content: answers[requests.length - 1] ?? '', promptTokens: 1, outputTokens: 1, durationMs: 1 }
            },
            async listModels() { return [] },
        }
        const result = await generateWorkflow('x', connectors, { llm, model: 'm', contextTokens: 4096, maxRepairAttempts: 2 })
        expect(requests).toHaveLength(2)
        expect(requests[1]?.content).toContain('Fix only that script')
        expect(requests[1]?.format).toHaveProperty('properties.code')
        expect(result.issues).toEqual([])
        const loop = result.dsl.steps[1]
        expect(loop?.kind === 'loop' && loop.body[0]?.kind === 'method' && loop.body[0].fields[0]?.value).toEqual({ script: fixed })
    })
})

describe('reading properties of scalar inputs', () => {
    const lookup = (code: string, path: string) => withTitle(script(code, [{ step: 's1', path }, { step: 's2', path: 'key' }]))

    it('flags a property read on a list of declared strings, pointing at the whole items', () => {
        const messages = validateWorkflow(lookup('for (var i = 0; i < VAR_0.length; i++) { if (VAR_0[i] === VAR_1) { RESULT_VAR = VAR_0[i].id; } }',
            'issues[].key'), connectors).map((issue) => issue.message)
        expect(messages).toEqual([expect.stringMatching(/reads VAR_0\.id, but input VAR_0 \(issues\[\]\.key\) holds string values.*path "issues\[\]"/)])
    })

    it('accepts method calls and length on strings, and property reads on object inputs', () => {
        expect(validateWorkflow(lookup('RESULT_VAR = VAR_0.toUpperCase() + VAR_0.length;', 'issues[].key'), connectors)).toEqual([])
        expect(validateWorkflow(lookup('RESULT_VAR = VAR_0[0].key;', 'issues'), connectors)).toEqual([])
    })
})

describe('copied example headers', () => {
    it('are stripped from the top of a script, other comments stay', () => {
        const code = "// ConfigItem.InciState from VAR_0=success.result[i].cmdb_status_title\n// map the status\nRESULT_VAR = VAR_0;"
        const loop = normalizeWorkflow(withTitle(script(code))).steps[1]
        const value = loop?.kind === 'loop' && loop.body[0]?.kind === 'method' ? loop.body[0].fields[0]?.value : undefined
        expect(value).toMatchObject({ script: { code: '// map the status\nRESULT_VAR = VAR_0;' } })
    })
})

describe('double-escaped script code', () => {
    it('turns literal \\n into line breaks when that makes the script valid', () => {
        const code = String.raw`RESULT_VAR = false;\nfor (var i = 0; i < VAR_0.length; i++) {\n    if (VAR_0[i] === "a") RESULT_VAR = true;\n}`
        const fixed = unescapeScriptCode(code)
        expect(fixed.split('\n')).toHaveLength(4)
        expect(checkScript(fixed, 1)).toEqual([])
    })

    it('keeps a valid one-line script with \\n inside a string', () => {
        const code = String.raw`RESULT_VAR = VAR_0.join("\n");`
        expect(unescapeScriptCode(code)).toBe(code)
    })
})
