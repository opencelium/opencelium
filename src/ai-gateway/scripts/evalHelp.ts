// Asks the help assistant a fixed set of questions through a running gateway and checks each answer's sources: the page
// that answers it must be among them, and a question the docs do not cover must be answered as not documented.
// Usage: node scripts/evalHelp.ts [gatewayUrl]   (needs the gateway and Ollama running)

type Case = { question: string; page: string | null; language?: 'en' | 'de' }

const CASES: Case[] = [
    { question: 'How do I get an e-mail when a schedule fails?', page: 'guides/schedule-and-notify' },
    { question: 'What cron format does a schedule use?', page: 'guides/schedule-and-notify' },
    { question: 'How can an outside system start a workflow?', page: 'guides/schedule-and-notify' },
    { question: 'How do I loop over the items of a response?', page: 'guides/branch-and-loop' },
    { question: 'How do I run a step only when a value is empty?', page: 'guides/branch-and-loop' },
    { question: 'How do I configure LDAP login?', page: 'guides/users-and-permissions' },
    { question: 'How do I turn on two-factor authentication?', page: 'guides/users-and-permissions' },
    { question: 'How do I give a user access only to schedules?', page: 'guides/users-and-permissions' },
    { question: 'How do I step through a loop in debug mode?', page: 'guides/debug-a-workflow' },
    { question: 'Where do I see the logs of an earlier run?', page: 'guides/debug-a-workflow' },
    { question: 'What is a data aggregator?', page: 'concepts/data-mapping' },
    { question: 'How do I transform a value with a script before sending it?', page: 'concepts/data-mapping' },
    { question: 'What has to be backed up?', page: 'operations/backup-and-restore' },
    { question: 'Which setting configures the invoker repository?', page: 'reference/configuration' },
    { question: 'What is the keyboard shortcut for the command palette?', page: 'reference/shortcuts' },
    { question: 'How do I save a workflow as a template?', page: 'guides/reuse-with-templates' },
    { question: 'How do I move templates to another system?', page: 'guides/reuse-with-templates' },
    { question: 'How do I call a GraphQL API?', page: 'guides/call-any-api' },
    { question: 'The application does not start, where do I begin?', page: 'operations/troubleshooting' },
    { question: 'How do I undo a change in the workflow editor?', page: 'guides/undo-and-history' },
    { question: 'How do I add a note to a step?', page: 'guides/annotate-a-workflow' },
    { question: 'How do I skip steps with a jump?', page: 'guides/skip-steps-with-joints' },
    { question: 'How do I start one workflow from another?', page: 'guides/chain-workflows' },
    { question: 'How do I update OpenCelium?', page: 'operations/updating' },
    { question: 'Wie bekomme ich eine E-Mail, wenn ein Zeitplan fehlschlägt?', page: 'guides/schedule-and-notify', language: 'de' },
    { question: 'Wie richte ich die Anmeldung über LDAP ein?', page: 'guides/users-and-permissions', language: 'de' },
    { question: 'Was ist ein Datenaggregator?', page: 'concepts/data-mapping', language: 'de' },
    // Not in the documentation: the answer must say so instead of inventing steps.
    { question: 'How do I connect OpenCelium to SAP S/4HANA via RFC?', page: null },
    { question: 'Can OpenCelium send SMS notifications?', page: null },
    { question: 'Wie exportiere ich Workflows als PDF?', page: null, language: 'de' },
]

const NOT_DOCUMENTED_RE = /(does not|doesn't|do not|don't) (describe|cover|mention|say)|not (documented|described|covered)|no information|nicht (beschrieben|dokumentiert|erwähnt|abgedeckt)|keine (informationen|angaben)/i

type Event = { type: string; sources?: { url: string }[]; text?: string; message?: string }

const gateway = process.argv[2] ?? 'http://127.0.0.1:8787'
let passed = 0
const started = Date.now()
for (const { question, page, language = 'en' } of CASES) {
    const response = await fetch(`${gateway}/help/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, messages: [{ role: 'user', content: question }] }),
    })
    const events = (await response.text()).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line) as Event)
    const sources = events.find((event) => event.type === 'sources')?.sources ?? []
    const answer = events.filter((event) => event.type === 'delta').map((event) => event.text).join('')
    const pages = sources.map((source) => source.url.replace(/^.*\/en\/prod\//, '').replace(/\.html#.*$/, ''))
    const isPass = page === null ? sources.length === 0 || NOT_DOCUMENTED_RE.test(answer) : pages.includes(page)
    if (isPass) passed++
    else console.log(`FAIL ${JSON.stringify(question)}\n  expected ${page ?? 'not documented'}, sources ${JSON.stringify(pages)}\n  answer: ${answer.slice(0, 300).replace(/\n/g, ' ')}`)
}
console.log(`${passed}/${CASES.length} answered from the right place, ${((Date.now() - started) / CASES.length / 1000).toFixed(1)} s per question`)
process.exitCode = passed === CASES.length ? 0 : 1
