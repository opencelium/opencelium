import { fileURLToPath } from 'node:url'

export type GatewayConfig = {
    host: string
    port: number
    ollamaUrl: string
    workflowModel: string
    /** Picks palette commands: a small model is enough and answers in a second or two. */
    commandModel: string
    invokerDir: string
    /** Templates whose transformation scripts serve as examples for generated ones. */
    templateDir: string
    embedModel: string
    /** whisper.cpp's whisper-server; empty turns voice input off. */
    speechUrl: string
    corsOrigins: string[]
    maxRepairAttempts: number
    contextTokens: number
    chatTimeoutMs: number
}

const defaultInvokerDir = fileURLToPath(new URL('../../backend/runtime/invoker', import.meta.url))
const defaultTemplateDir = fileURLToPath(new URL('../../backend/runtime/templates', import.meta.url))

function toInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
    return {
        // Loopback by default: the gateway has no auth of its own yet.
        host: env.AI_GATEWAY_HOST ?? '127.0.0.1',
        port: toInt(env.AI_GATEWAY_PORT, 8787),
        ollamaUrl: env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
        workflowModel: env.AI_WORKFLOW_MODEL ?? 'qwen2.5-coder:14b',
        commandModel: env.AI_COMMAND_MODEL ?? 'qwen2.5-coder:7b',
        invokerDir: env.AI_INVOKER_DIR ?? defaultInvokerDir,
        templateDir: env.AI_TEMPLATE_DIR ?? defaultTemplateDir,
        embedModel: env.AI_EMBED_MODEL ?? 'nomic-embed-text',
        speechUrl: env.AI_SPEECH_URL ?? 'http://127.0.0.1:8178',
        corsOrigins: (env.AI_CORS_ORIGINS ?? 'http://localhost:5173')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
        maxRepairAttempts: toInt(env.AI_MAX_REPAIR_ATTEMPTS, 2),
        contextTokens: toInt(env.AI_CONTEXT_TOKENS, 16384),
        chatTimeoutMs: toInt(env.AI_CHAT_TIMEOUT_MS, 15 * 60_000),
    }
}
