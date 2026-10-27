// Routes a fixed set of prompts through a running gateway and reports which landed on the wrong command.
// Usage: node scripts/evalCommandRouting.ts [gatewayUrl]   (needs the gateway and Ollama running)
import { readFile } from 'node:fs/promises'

type Case = { prompt: string; page: string; expected: string | null; intent?: Record<string, string> }

const CASES: Case[] = [
    { prompt: 'delete the user ba@user.com', page: '/user/update/2', expected: 'delete user' },
    { prompt: 'lösche den Benutzer ba@user.com', page: '/user/view/1', expected: 'delete user' },
    { prompt: 'remove the idoit otrs schedule', page: '/user', expected: 'delete schedule' },
    { prompt: 'edit the user test@user.com', page: '/user/view/1', expected: 'update user' },
    { prompt: 'edit the schedule idoit', page: '/', expected: 'update schedule' },
    { prompt: 'Rolle admin bearbeiten', page: '/', expected: 'update role' },
    { prompt: 'open the user admin@opencelium.io', page: '/schedule', expected: 'search user' },
    { prompt: 'open schedule idoit', page: '/user/update/2', expected: 'search schedule' },
    { prompt: 'Zeitplan idoit öffnen', page: '/', expected: 'search schedule' },
    { prompt: 'find category test', page: '/', expected: 'search category' },
    { prompt: 'show me all users', page: '/user/update/2', expected: 'list users' },
    { prompt: 'zeige alle Rollen', page: '/', expected: 'list roles' },
    { prompt: 'open the connectors', page: '/', expected: 'list connectors' },
    { prompt: 'neuen Zeitplan anlegen', page: '/user', expected: 'create schedule' },
    { prompt: 'switch to dark mode', page: '/user', expected: 'ui theme' },
    { prompt: 'which license do I have', page: '/', expected: 'check license' },
    { prompt: 'run the workflow fake2 every 15 minutes', page: '/', expected: 'create schedule', intent: { workflow: 'fake2', cronExp: '0 0/15 * * * ?' } },
    { prompt: 'schedule the idoit to OTRS workflow every day at 6 am', page: '/', expected: 'create schedule', intent: { cronExp: '0 0 6 * * ?' } },
    { prompt: 'Zeitplan für den Workflow config item jeden Montag und Freitag um 18 Uhr anlegen', page: '/', expected: 'create schedule', intent: { workflow: 'config item', cronExp: '0 0 18 ? * 2,6' } },
    { prompt: 'add a connector for i-doit called CMDB production', page: '/', expected: 'create connector', intent: { system: 'i-doit', title: 'CMDB production' } },
    { prompt: 'neuen Konnektor für OTRS anlegen', page: '/', expected: 'create connector', intent: { system: 'OTRS' } },
    { prompt: 'create a workflow from the template idoit otrs incidents', page: '/', expected: 'create workflow', intent: { source: 'template' } },
    { prompt: 'create a workflow that creates an OTRS ticket for every new i-doit object', page: '/', expected: 'create workflow', intent: { source: 'ai', from: 'i-doit', to: 'OTRS' } },
    // "for every new object" is not a timetable, and the Schedules page must not turn it into a schedule.
    { prompt: 'create a workflow that creates an OTRS ticket for every new i-doit object', page: '/schedule', expected: 'create workflow', intent: { source: 'ai' } },
    { prompt: 'erstelle einen Workflow, der für jedes neue i-doit Objekt ein OTRS Ticket anlegt', page: '/schedule', expected: 'create workflow', intent: { source: 'ai' } },
    { prompt: 'order a pizza', page: '/', expected: null },
    { prompt: 'book a flight to Berlin', page: '/', expected: null },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
const commands = JSON.parse(await readFile(new URL('../test/fixtures/commandCatalog.json', import.meta.url), 'utf8'))
let passed = 0
const started = Date.now()
for (const { prompt, page, expected, intent } of CASES) {
    const response = await fetch(`${gateway}/command/route`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, page, commands }),
    })
    const { commandId, argument, intent: values } = (await response.json()) as {
        commandId: string | null; argument: string; intent: Record<string, unknown> | null
    }
    const isIntentPass = Object.entries(intent ?? {}).every(([key, value]) => values?.[key] === value)
    const isPass = (expected === null ? commandId === null : Boolean(commandId?.startsWith(expected))) && isIntentPass
    if (isPass) passed++
    else console.log(`FAIL ${JSON.stringify(prompt)} (${page}) -> ${commandId} ${JSON.stringify(argument)} ${JSON.stringify(values)}, expected ${expected} ${JSON.stringify(intent ?? {})}`)
}
console.log(`${passed}/${CASES.length} routed correctly, ${((Date.now() - started) / CASES.length / 1000).toFixed(1)} s per prompt`)
process.exitCode = passed === CASES.length ? 0 : 1
