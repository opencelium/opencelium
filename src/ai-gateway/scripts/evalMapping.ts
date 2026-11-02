// Reads "suggest references for X from Y" requests through a running gateway and reports wrong targets or sources.
// Usage: node scripts/evalMapping.ts [gatewayUrl]   (needs the gateway and Ollama running)
type Case = { prompt: string; target: string; source: string }

const METHODS = [
    'SessionCreate', 'cmdb.objects.read', 'cmdb.category.read', 'ConfigItemSearch', 'ConfigItemGet',
    'ConfigItemCreate', 'ConfigItemUpdate', 'TicketCreate', 'getCustomers', 'createClient',
]

const CASES: Case[] = [
    { prompt: 'suggest references for config item update method from config item get method', target: 'ConfigItemUpdate', source: 'ConfigItemGet' },
    { prompt: 'suggest mapping for TicketCreate from cmdb objects read', target: 'TicketCreate', source: 'cmdb.objects.read' },
    { prompt: 'suggest references/mapping for create client method from get customers method', target: 'createClient', source: 'getCustomers' },
    { prompt: 'fill the body of config item create with values from cmdb category read', target: 'ConfigItemCreate', source: 'cmdb.category.read' },
    { prompt: 'map get customers to create client', target: 'createClient', source: 'getCustomers' },
    { prompt: 'suggest references for this method from config item search', target: '', source: 'ConfigItemSearch' },
    { prompt: 'suggest a mapping for ticket create', target: 'TicketCreate', source: '' },
    { prompt: 'schlage Referenzen für ConfigItemUpdate aus ConfigItemGet vor', target: 'ConfigItemUpdate', source: 'ConfigItemGet' },
    { prompt: 'Mapping für Ticket Create von cmdb objects read vorschlagen', target: 'TicketCreate', source: 'cmdb.objects.read' },
    { prompt: 'fülle den Body von create client mit der Antwort von get customers', target: 'createClient', source: 'getCustomers' },
    { prompt: 'ordne config item get zu config item update zu', target: 'ConfigItemUpdate', source: 'ConfigItemGet' },
    { prompt: 'schlage ein Mapping aus Config Item Search vor', target: '', source: 'ConfigItemSearch' },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
let passed = 0
let totalMs = 0
for (const { prompt, target, source } of CASES) {
    const started = Date.now()
    const response = await fetch(`${gateway}/workflow/mapping/intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, methods: METHODS }),
    })
    totalMs += Date.now() - started
    const answer = (await response.json()) as { target: string; source: string }
    if (answer.target === target && answer.source === source) passed++
    else console.log(`FAIL ${JSON.stringify(prompt)} -> ${JSON.stringify(answer.target)} from ${JSON.stringify(answer.source)}, expected ${JSON.stringify(target)} from ${JSON.stringify(source)}`)
}
console.log(`${passed}/${CASES.length} read correctly, ${(totalMs / CASES.length / 1000).toFixed(1)} s per request`)
process.exitCode = passed === CASES.length ? 0 : 1
