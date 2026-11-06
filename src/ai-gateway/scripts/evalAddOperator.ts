// Reads "add an if / a loop before/after <step> …" requests through a running gateway and reports which got the kind,
// position, step or condition wrong. The condition is checked by the words it must keep.
// Usage: node scripts/evalAddOperator.ts [gatewayUrl]   (needs the gateway and Ollama running)

type Case = { prompt: string; kind: 'if' | 'loop'; position?: 'after' | 'before'; stepId: string | null; conditionWords: string[] }

const STEPS = [
    { id: 'n1', label: 'SearchIssues' },
    { id: 'n2', label: 'ConfigItemSearch' },
    { id: 'n3', label: 'ConfigItemCreate' },
    { id: 'n4', label: 'CreateTicket' },
]

const CASES: Case[] = [
    { prompt: 'add an if after config item search when nothing was found', kind: 'if', position: 'after', stepId: 'n2', conditionWords: ['nothing', 'found'] },
    { prompt: 'add a condition before CreateTicket: only tickets with priority high', kind: 'if', position: 'before', stepId: 'n4', conditionWords: ['priority', 'high'] },
    { prompt: 'only create the config item if the search found no result', kind: 'if', stepId: null, conditionWords: ['no result'] },
    { prompt: 'add a loop over the issues of search issues', kind: 'loop', position: 'after', stepId: 'n1', conditionWords: ['issues'] },
    { prompt: 'loop over all issues after SearchIssues', kind: 'loop', position: 'after', stepId: 'n1', conditionWords: ['issues'] },
    { prompt: 'for each issue add a loop', kind: 'loop', stepId: null, conditionWords: ['issue'] },
    { prompt: 'add an if when the status is closed', kind: 'if', stepId: null, conditionWords: ['status', 'closed'] },
    { prompt: 'add an if step before config item create when the host name is empty', kind: 'if', position: 'before', stepId: 'n3', conditionWords: ['host', 'empty'] },
    { prompt: 'füge nach ConfigItemSearch eine Bedingung ein: wenn nichts gefunden wurde', kind: 'if', position: 'after', stepId: 'n2', conditionWords: ['nichts', 'gefunden'] },
    { prompt: 'füge eine Schleife über die Issues von Search Issues hinzu', kind: 'loop', position: 'after', stepId: 'n1', conditionWords: ['issues'] },
    { prompt: 'füge vor CreateTicket ein if ein, nur wenn die Priorität hoch ist', kind: 'if', position: 'before', stepId: 'n4', conditionWords: ['priorität', 'hoch'] },
    { prompt: 'für jedes Ticket eine Schleife einfügen', kind: 'loop', stepId: null, conditionWords: ['ticket'] },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
let passed = 0
let totalMs = 0
for (const expected of CASES) {
    const started = Date.now()
    const response = await fetch(`${gateway}/workflow/add-operator/intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: expected.prompt, steps: STEPS }),
    })
    totalMs += Date.now() - started
    const answer = (await response.json()) as { kind: string; position: string; stepId: string | null; condition: string }
    const wrong = [
        answer.kind !== expected.kind && 'kind',
        expected.position && answer.position !== expected.position && 'position',
        answer.stepId !== expected.stepId && 'step',
        !expected.conditionWords.every((word) => answer.condition.toLowerCase().includes(word)) && 'condition',
    ].filter(Boolean)
    if (wrong.length === 0) passed++
    else console.log(`FAIL ${JSON.stringify(expected.prompt)} (${wrong.join(', ')}) -> ${JSON.stringify(answer)}`)
}
console.log(`${passed}/${CASES.length} read correctly, ${(totalMs / CASES.length / 1000).toFixed(1)} s per request`)
process.exitCode = passed === CASES.length ? 0 : 1
