// Routes "where is …" requests through a running gateway and reports which landed on the wrong guide or method.
// Usage: node scripts/evalGuideRouting.ts [gatewayUrl]   (needs the gateway and Ollama running)
// The requests are what remains after the wake word, spelled the way speech recognition writes them.
import { readFile } from 'node:fs/promises'

type Case = { prompt: string; guide: string | null; method?: string }

const METHODS = [
    'cmdb.objects.read', 'cmdb.category.read', 'SessionCreate', 'ConfigItemSearch', 'ConfigItemGet',
    'ConfigItemCreate', 'ConfigItemUpdate', 'TicketCreate', 'getCustomers', 'createClient',
]

const CASES: Case[] = [
    { prompt: 'where is the header of the method?', guide: 'method-headers', method: '' },
    { prompt: 'where are the headers of ConfigItemGet', guide: 'method-headers', method: 'ConfigItemGet' },
    { prompt: 'show me the headers of config item get', guide: 'method-headers', method: 'ConfigItemGet' },
    { prompt: 'where are the request headers', guide: 'method-headers', method: '' },
    { prompt: 'where do I set the authorization header for session create', guide: 'method-headers', method: 'SessionCreate' },
    { prompt: 'how do I open the request body of TicketCreate', guide: 'method-body', method: 'TicketCreate' },
    { prompt: 'show me where the payload is', guide: 'method-body', method: '' },
    { prompt: 'open the body of get customers', guide: 'method-body', method: 'getCustomers' },
    { prompt: 'where is the body of the config item update method', guide: 'method-body', method: 'ConfigItemUpdate' },
    { prompt: 'where can I change the URL of cmdb objects read', guide: 'method-url', method: 'cmdb.objects.read' },
    { prompt: 'where is the endpoint of this method', guide: 'method-url', method: '' },
    { prompt: 'what URL does ticket create call', guide: 'method-url', method: 'TicketCreate' },
    { prompt: 'how can I test the ConfigItemCreate request', guide: 'method-try', method: 'ConfigItemCreate' },
    { prompt: 'I want to try this method once', guide: 'method-try', method: '' },
    { prompt: 'send a test request for create client', guide: 'method-try', method: 'createClient' },
    { prompt: 'wo ist der Header der Methode?', guide: 'method-headers', method: '' },
    { prompt: 'wo finde ich die Header von ConfigItemGet', guide: 'method-headers', method: 'ConfigItemGet' },
    { prompt: 'wo sind die Kopfzeilen von Session Create', guide: 'method-headers', method: 'SessionCreate' },
    { prompt: 'zeig mir den Body von TicketCreate', guide: 'method-body', method: 'TicketCreate' },
    { prompt: 'wo ist der Inhalt der Anfrage', guide: 'method-body', method: '' },
    { prompt: 'wo finde ich den Request Body von config item update', guide: 'method-body', method: 'ConfigItemUpdate' },
    { prompt: 'wo kann ich die URL von cmdb objects read ändern', guide: 'method-url', method: 'cmdb.objects.read' },
    { prompt: 'zeige mir die Adresse von get customers', guide: 'method-url', method: 'getCustomers' },
    { prompt: 'wie teste ich die Methode ConfigItemCreate', guide: 'method-try', method: 'ConfigItemCreate' },
    { prompt: 'ich möchte diese Methode einmal ausprobieren', guide: 'method-try', method: '' },
    { prompt: 'add a new method get customers from the CRM after ConfigItemGet', guide: 'add-method' },
    { prompt: 'füge die Methode Service Get aus OTRS nach Config Item Create hinzu', guide: 'add-method' },
    { prompt: 'insert cmdb category read from i-doit before cmdb objects read', guide: 'add-method' },
    { prompt: 'suggest references for config item update method from config item get method', guide: 'suggest-mapping' },
    { prompt: 'suggest a mapping for TicketCreate from cmdb objects read', guide: 'suggest-mapping' },
    { prompt: 'map the fields of create client from get customers', guide: 'suggest-mapping' },
    { prompt: 'schlage Referenzen für ConfigItemCreate aus cmdb objects read vor', guide: 'suggest-mapping' },
    { prompt: 'Mapping für Ticket Create von Config Item Get vorschlagen', guide: 'suggest-mapping' },
    { prompt: 'how does the mapping of references work?', guide: null },
    { prompt: 'apply transformation for vendor property with convert it to upper case', guide: 'apply-transformation' },
    { prompt: 'transform the config item number so only the first 10 characters are sent', guide: 'apply-transformation' },
    { prompt: 'wende eine Transformation auf Vendor an: alles in Großbuchstaben', guide: 'apply-transformation' },
    { prompt: 'how do transformations work?', guide: 'method-transformation' },
    { prompt: 'how do I apply a transformation?', guide: 'method-transformation', method: '' },
    { prompt: 'where do I transform a value of get customers', guide: 'method-transformation', method: 'getCustomers' },
    { prompt: 'show me how to add a script to the headers of session create', guide: 'method-transformation', method: 'SessionCreate' },
    { prompt: 'wie füge ich eine Transformation hinzu?', guide: 'method-transformation', method: '' },
    { prompt: 'wo kann ich einen Wert von TicketCreate transformieren', guide: 'method-transformation', method: 'TicketCreate' },
    { prompt: 'how do I add a new method to the workflow?', guide: null },
    { prompt: 'wie füge ich eine Methode hinzu?', guide: null },
    { prompt: 'order a pizza', guide: null },
    { prompt: 'switch to dark mode', guide: null },
    { prompt: 'wie spät ist es', guide: null },
    { prompt: 'what is the weather in Berlin', guide: null },
    { prompt: 'erzähl mir einen Witz', guide: null },
]

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
const guides = JSON.parse(await readFile(new URL('../test/fixtures/guideCatalog.json', import.meta.url), 'utf8'))
let passed = 0
let totalMs = 0
for (const { prompt, guide, method } of CASES) {
    const started = Date.now()
    const response = await fetch(`${gateway}/guide/intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, guides, methods: METHODS }),
    })
    totalMs += Date.now() - started
    const answer = (await response.json()) as { guideId: string | null; method: string }
    const isPass = answer.guideId === guide && (method === undefined || answer.method === method)
    if (isPass) passed++
    else console.log(`FAIL ${JSON.stringify(prompt)} -> ${answer.guideId} ${JSON.stringify(answer.method)}, expected ${guide} ${JSON.stringify(method ?? '*')}`)
}
console.log(`${passed}/${CASES.length} routed correctly, ${(totalMs / CASES.length / 1000).toFixed(1)} s per request`)
process.exitCode = passed === CASES.length ? 0 : 1
