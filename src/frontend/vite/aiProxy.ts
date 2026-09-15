import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { ServerResponse } from 'node:http'
import { loadEnv, type Connect, type Plugin } from 'vite'

/**
 * Dev-only bridge between the AI panels and a real model.
 *
 * It exists because the browser must never hold an API key, and this project's backend is
 * out of scope for the prototype — the Vite dev server is the only server-side process
 * available, so the call is made here. This is a harness, not a deployment: it lives only
 * while `npm run dev` runs. The production home for both routes is the Java backend, which
 * can serve them unchanged — the frontend already speaks this contract.
 *
 * Enable by putting an un-prefixed key in .env.local — un-prefixed so Vite never bundles
 * it into the client, and .env.local rather than .env because only the former is ignored:
 *
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   VITE_ENABLE_AI_MOCK=false          # stand the MSW mock down
 *   VITE_AI_PROXY_URL=http://localhost:5173
 *
 * With no key present the plugin does nothing and the MSW mock keeps answering.
 */

const MODEL = 'claude-opus-5'
const MAX_TOKENS = 8000

/* ------------------------------------------------------------------ mapping */

const MappingResult = z.object({
	suggestions: z.array(z.object({
		targetPath: z.string(),
		sourceColor: z.string(),
		sourcePath: z.string(),
		confidence: z.number().min(0).max(1),
		rationale: z.string(),
	})),
})

const MAPPING_SYSTEM = `You map fields between two HTTP APIs inside an integration tool.

You receive a target method's request-body fields and the response-body fields of the
methods upstream of it. Every field is given as a path and a scalar kind. You never see
values — only the shape.

Propose which upstream response field should fill each target request field.

Rules:
- Only ever use a sourcePath and sourceColor exactly as they appear in the input. Never
  invent, correct, complete or reformat a path. A path that is not in the input is a
  failure, not a near miss.
- At most one source per target field. One source may fill several target fields.
- Leave a target field out entirely when nothing plausibly matches. A short, correct set
  is worth far more than a complete one — a wrong mapping silently corrupts live data.
- Field names are often abbreviated, domain-specific, or in German. Match on meaning:
  nachname/lastName, betrag/amount, objID/identifier, reporterMail/email.
- confidence is your own calibrated belief, 0 to 1. Reserve above 0.9 for cases where the
  names plainly denote the same thing. Use 0.5-0.7 when the meaning is likely but the
  names only loosely agree.
- rationale is one plain sentence a non-programmer can read. Say why they correspond, and
  name any conversion the binding will need (a date reformat, a number-to-string).`

/* ------------------------------------------------------------------- script */

const ScriptResult = z.object({
	script: z.string(),
	summary: z.string(),
})

const SCRIPT_SYSTEM = `You write small transformation scripts for an integration tool.

Each script runs between reading a value from one API's response and writing it into
another API's request. Its contract is fixed:

- Inputs arrive as the variables VAR_0, VAR_1, ... exactly as listed in the request.
  They are already assigned; never declare them and never read any other variable.
- The script assigns exactly once, to RESULT_VAR.
- The body is a single expression. No statements, no functions, no imports, no loops.
- Write in the language given in the request, not always JavaScript.

For intent "generate", write the script the instruction describes.
For intent "repair", you are given a script that still names VARIABLE_NOT_EXIST where an
input it used to receive has been removed. Rewrite it to use the inputs that remain and
preserve the original intent as closely as possible. If nothing sensible remains, assign a
safe empty value rather than leave the marker in place.

summary is one plain sentence saying what the script does — the user reads it before
accepting the script, and may not read the code.`

/* ----------------------------------------------------------------- plumbing */

const readJsonBody = async (req: Connect.IncomingMessage) => {
	const chunks: Buffer[] = []
	for await (const chunk of req) chunks.push(chunk as Buffer)
	return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as unknown
}

type MappingPayload = {
	target: { fields: { path: string }[] }
	sources: { color: string; fields: { path: string }[] }[]
}

/**
 * Structured output guarantees the shape of the answer, never that the paths in it are
 * real. A hallucinated path would be written into a customer's integration as a reference
 * that silently resolves to nothing, so anything not present in the request is dropped.
 */
const keepRealPaths = (
	payload: MappingPayload,
	suggestions: z.infer<typeof MappingResult>['suggestions'],
) => {
	const targets = new Set(payload.target.fields.map((field) => field.path))
	const sources = new Map(payload.sources.map((source) =>
		[source.color.toLowerCase(), new Set(source.fields.map((field) => field.path))]))
	return suggestions.filter((suggestion) =>
		targets.has(suggestion.targetPath)
		&& !!sources.get(suggestion.sourceColor.toLowerCase())?.has(suggestion.sourcePath))
}

const RESULT_ASSIGNMENT = /(^|[^A-Za-z0-9_])RESULT_VAR\s*=/

type ScriptPayload = {
	intent: 'generate' | 'repair'
	language: string
	resultPath: string
	instruction?: string
	script?: string
	args: { name: string; path: string; methodName: string }[]
}

const send = (res: ServerResponse, status: number, body: unknown) => {
	res.statusCode = status
	res.setHeader('content-type', 'application/json')
	res.end(JSON.stringify(body))
}

const route = (
	handler: (body: unknown) => Promise<unknown>,
): Connect.NextHandleFunction => async (req, res, next) => {
	if (req.method !== 'POST') return next()
	try {
		send(res, 200, await handler(await readJsonBody(req)))
	} catch (error) {
		console.error('[ai-proxy]', error)
		send(res, 502, { message: error instanceof Error ? error.message : 'AI request failed' })
	}
}

export function aiProxy(): Plugin {
	return {
		name: 'oc-ai-proxy',
		apply: 'serve',
		configureServer(server) {
			// Read here rather than in vite.config.ts: that file must stay a plain object
			// export, because vitest.config.ts merges it and mergeConfig cannot merge a
			// callback. The '' prefix loads un-prefixed vars, which VITE_ ones never are.
			const { ANTHROPIC_API_KEY: apiKey } =
				loadEnv(server.config.mode, server.config.root, '')
			if (!apiKey) {
				server.config.logger.info(
					'[ai-proxy] ANTHROPIC_API_KEY not set — leaving /ai/* to the MSW mock',
				)
				return
			}
			const client = new Anthropic({ apiKey })
			server.config.logger.info(`[ai-proxy] /ai/* → ${MODEL}`)

			server.middlewares.use('/ai/field-binding-suggestions', route(async (body) => {
				const payload = body as MappingPayload
				const result = await client.messages.parse({
					model: MODEL,
					max_tokens: MAX_TOKENS,
					// The instructions are byte-identical on every call, so they are the one
					// piece worth caching here. Caching the schemas themselves needs them
					// hoisted ahead of the varying half — a backend concern, not a dev bridge's.
					system: [{ type: 'text', text: MAPPING_SYSTEM, cache_control: { type: 'ephemeral' } }],
					messages: [{ role: 'user', content: JSON.stringify(payload) }],
					output_config: { format: zodOutputFormat(MappingResult) },
				})

				const proposed = result.parsed_output?.suggestions ?? []
				const real = keepRealPaths(payload, proposed)
				if (real.length !== proposed.length) {
					console.warn(`[ai-proxy] dropped ${proposed.length - real.length}`
						+ ' suggestion(s) naming a path that is not in the request')
				}
				return {
					suggestions: real.map((suggestion) => ({
						...suggestion,
						id: `${suggestion.sourceColor}:${suggestion.sourcePath}->${suggestion.targetPath}`,
						origin: 'model' as const,
						confidence: Number(suggestion.confidence.toFixed(2)),
					})),
				}
			}))

			server.middlewares.use('/ai/enhancement-script', route(async (body) => {
				const payload = body as ScriptPayload
				const result = await client.messages.parse({
					model: MODEL,
					max_tokens: MAX_TOKENS,
					system: [{ type: 'text', text: SCRIPT_SYSTEM, cache_control: { type: 'ephemeral' } }],
					messages: [{ role: 'user', content: JSON.stringify(payload) }],
					output_config: { format: zodOutputFormat(ScriptResult) },
				})

				const written = result.parsed_output
				if (!written) throw new Error('The model returned no script')
				// Markdown fences shouldn't survive structured output, but a script carrying
				// them would land in the editor as a syntax error the user has to hunt down.
				const script = written.script
					.replace(/^\s*```[a-z]*\n?/i, '')
					.replace(/\n?```\s*$/, '')
					.trim()
				if (!RESULT_ASSIGNMENT.test(script)) {
					throw new Error('The model returned a script that never assigns to RESULT_VAR')
				}
				return { script, summary: written.summary }
			}))
		},
	}
}
