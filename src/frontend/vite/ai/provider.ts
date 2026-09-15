import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

/**
 * The model call, behind one method.
 *
 * The routes, the prompts and the validation of what comes back are provider-independent —
 * only this file knows which vendor is answering. Both implementations take the same Zod
 * schema and return a value already parsed against it, so a caller cannot tell them apart
 * and swapping vendors is a key change rather than a code change.
 */

export type CompletionRequest<T> = {
	system: string
	user: string
	schema: z.ZodType<T>
}

export type AiProvider = {
	/** Shown in the dev-server log so it is obvious which vendor is answering. */
	label: string
	complete: <T>(request: CompletionRequest<T>) => Promise<T>
}

const MAX_TOKENS = 8000

/**
 * Both vendors return 429 and 5xx under load — a model being momentarily busy is the
 * single most common failure here and is not worth surfacing to the user. Retried with
 * exponential backoff before the request is allowed to fail.
 */
const RETRY_ATTEMPTS = 4
const RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504]
const REQUEST_TIMEOUT_MS = 90_000

/* --------------------------------------------------------------- Anthropic */

const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5'

const anthropicProvider = (apiKey: string, model: string): AiProvider => {
	const client = new Anthropic({
		apiKey,
		maxRetries: RETRY_ATTEMPTS - 1,
		timeout: REQUEST_TIMEOUT_MS,
	})
	return {
		label: `anthropic · ${model}`,
		complete: async <T>({ system, user, schema }: CompletionRequest<T>) => {
			const result = await client.messages.parse({
				model,
				max_tokens: MAX_TOKENS,
				// Byte-identical on every call, so it is the one piece worth caching here.
				system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
				messages: [{ role: 'user', content: user }],
				output_config: { format: zodOutputFormat(schema as never) },
			})
			if (!result.parsed_output) throw new Error('The model returned no parsable output')
			return schema.parse(result.parsed_output)
		},
	}
}

/* ------------------------------------------------------------------ Gemini */

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

/**
 * Gemini takes standard JSON Schema but only a documented subset of its keywords, and
 * `$schema` is not among them — Zod emits it, so it is stripped before the call.
 */
const toGeminiSchema = (schema: z.ZodType<unknown>) => {
	const { $schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>
	void $schema
	return rest
}

const geminiProvider = (apiKey: string, model: string): AiProvider => {
	// Retries are opt-in on this SDK: without retryOptions a momentary 503 reaches the
	// caller on the first attempt.
	const ai = new GoogleGenAI({
		apiKey,
		httpOptions: {
			timeout: REQUEST_TIMEOUT_MS,
			retryOptions: {
				attempts: RETRY_ATTEMPTS,
				httpStatusCodes: RETRYABLE_STATUS,
			},
		},
	})
	return {
		label: `gemini · ${model}`,
		complete: async <T>({ system, user, schema }: CompletionRequest<T>) => {
			const response = await ai.models.generateContent({
				model,
				contents: user,
				config: {
					systemInstruction: system,
					responseMimeType: 'application/json',
					responseJsonSchema: toGeminiSchema(schema),
				},
			})
			const text = response.text
			if (!text) throw new Error('The model returned an empty response')
			// Parsed against the same schema as the Anthropic path, so a malformed answer
			// fails here rather than downstream in the editor.
			return schema.parse(JSON.parse(text))
		},
	}
}

/* --------------------------------------------------------------- selection */

/**
 * Whichever key is present wins; set AI_PROVIDER to pick when both are. Returns null when
 * neither is configured, which leaves the MSW mock answering.
 */
export const resolveProvider = (env: Record<string, string>): AiProvider | null => {
	const anthropicKey = env.ANTHROPIC_API_KEY
	const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
	const preferred = env.AI_PROVIDER?.toLowerCase()
	const gemini = () => geminiProvider(geminiKey!, env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
	const anthropic = () =>
		anthropicProvider(anthropicKey!, env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL)

	if (preferred === 'gemini') {
		if (!geminiKey) throw new Error('AI_PROVIDER=gemini but GEMINI_API_KEY is not set')
		return gemini()
	}
	if (preferred === 'anthropic') {
		if (!anthropicKey) throw new Error('AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set')
		return anthropic()
	}
	if (geminiKey) return gemini()
	if (anthropicKey) return anthropic()
	return null
}
