// Reads "add <method> from <connector> before/after <step>" requests through a running gateway and reports which got the
// connector, operation, position or step wrong. Uses the installed i-doit, OTRS and Jira invokers.
// Usage: node scripts/evalAddMethod.ts [gatewayUrl]   (needs the gateway and Ollama running)

type Case = { prompt: string; connectorId: string | null; operation?: string | null; position?: 'after' | 'before'; stepId?: string | null }

const CONNECTORS = [
    { id: '1', title: 'i-doit production', invoker: 'i-doit' },
    { id: '2', title: 'OTRS', invoker: 'OTRS' },
    { id: '3', title: 'Jira Cloud', invoker: 'Jira' },
]
const STEPS = [
    { id: 'n1', label: 'cmdb.objects.read' },
    { id: 'n2', label: 'ConfigItemSearch' },
    { id: 'n3', label: 'ConfigItemGet' },
    { id: 'n4', label: 'ConfigItemCreate' },
]

const CASES: Case[] = [
    { prompt: 'add a new method config item update from OTRS after config item get', connectorId: '2', operation: 'ConfigItemUpdate', position: 'after', stepId: 'n3' },
    { prompt: 'add method cmdb object read from i-doit before ConfigItemSearch', connectorId: '1', operation: 'cmdb.object.read', position: 'before', stepId: 'n2' },
    { prompt: 'add the method get issue from Jira', connectorId: '3', operation: 'GetIssue', stepId: null },
    { prompt: 'add get issues from Jira Cloud after the config item get method', connectorId: '3', operation: 'GetIssues', position: 'after', stepId: 'n3' },
    { prompt: 'add create comment from Jira before config item create', connectorId: '3', operation: 'CreateComment', position: 'before', stepId: 'n4' },
    { prompt: 'add a method that searches services from OTRS after config item search', connectorId: '2', operation: 'ServiceSearch', position: 'after', stepId: 'n2' },
    { prompt: 'add a method from i-doit that reads all objects', connectorId: '1', operation: 'cmdb.objects.read', stepId: null },
    { prompt: 'add the i-doit version method after cmdb objects read', connectorId: '1', operation: 'idoit.version', position: 'after', stepId: 'n1' },
    { prompt: 'add method update issues from jira after config item create', connectorId: '3', operation: 'UpdateIssues', position: 'after', stepId: 'n4' },
    { prompt: 'füge die Methode Service Get aus OTRS nach Config Item Create hinzu', connectorId: '2', operation: 'ServiceGet', position: 'after', stepId: 'n4' },
    { prompt: 'füge eine neue Methode cmdb category read von i-doit vor cmdb objects read ein', connectorId: '1', operation: 'cmdb.category.read', position: 'before', stepId: 'n1' },
    { prompt: 'füge aus i-doit die Methode zum Löschen eines Objekts vor ConfigItemGet hinzu', connectorId: '1', operation: 'cmdb.object.delete', position: 'before', stepId: 'n3' },
    { prompt: 'füge LinkCreate aus OTRS hinzu', connectorId: '2', operation: 'LinkCreate', stepId: null },
    { prompt: 'add send fax from OTRS', connectorId: '2', operation: null },
    { prompt: 'add get users from Salesforce', connectorId: null, operation: null },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
let passed = 0
let totalMs = 0
for (const expected of CASES) {
    const started = Date.now()
    const response = await fetch(`${gateway}/workflow/add-method/intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: expected.prompt, connectors: CONNECTORS, steps: STEPS }),
    })
    totalMs += Date.now() - started
    const answer = (await response.json()) as Record<string, unknown>
    const fields = ['connectorId', 'operation', 'position', 'stepId'] as const
    const wrong = fields.filter((field) => expected[field] !== undefined && answer[field] !== expected[field])
    if (wrong.length === 0) passed++
    else console.log(`FAIL ${JSON.stringify(expected.prompt)}: ${wrong.map((field) => `${field}=${JSON.stringify(answer[field])} (expected ${JSON.stringify(expected[field])})`).join(', ')}`)
}
console.log(`${passed}/${CASES.length} read correctly, ${(totalMs / CASES.length / 1000).toFixed(1)} s per request`)
process.exitCode = passed === CASES.length ? 0 : 1
