// Calls a running gateway: npm run generate -- <from> <to|-> "<prompt>"
const [from, to, ...words] = process.argv.slice(2)
const prompt = words.join(' ')
const baseUrl = process.env.AI_GATEWAY_URL ?? 'http://127.0.0.1:8787'

if (!from || !to || !prompt) {
    console.error('Usage: npm run generate -- <from-invoker> <to-invoker|-> "<prompt>"')
    process.exit(1)
}

const started = performance.now()
const response = await fetch(`${baseUrl}/workflow/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, from, ...(to === '-' ? {} : { to }) }),
})
const body: unknown = await response.json()
console.log(JSON.stringify(body, null, 2))
console.error(`\nHTTP ${response.status} in ${((performance.now() - started) / 1000).toFixed(1)}s`)
