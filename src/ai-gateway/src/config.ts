import { fileURLToPath } from 'node:url'

export type GatewayConfig = {
    host: string
    port: number
    ollamaUrl: string
    workflowModel: string
    invokerDir: string
    /** Templates whose transformation scripts serve as examples for generated ones. */
    templateDir: string
    embedModel: string
    corsOrigins: string[]
    maxRepairAttempts: number
    contextTokens: number
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
        invokerDir: env.AI_INVOKER_DIR ?? defaultInvokerDir,
        templateDir: env.AI_TEMPLATE_DIR ?? defaultTemplateDir,
        embedModel: env.AI_EMBED_MODEL ?? 'nomic-embed-text',
        corsOrigins: (env.AI_CORS_ORIGINS ?? 'http://localhost:5173')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
        maxRepairAttempts: toInt(env.AI_MAX_REPAIR_ATTEMPTS, 2),
        contextTokens: toInt(env.AI_CONTEXT_TOKENS, 16384),
    }
}
