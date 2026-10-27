import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createInvokerRepository } from './invokers/invokerRepository.ts'
import { createOllamaClient } from './llm/ollamaClient.ts'
import { createOllamaEmbedder } from './llm/ollamaEmbedder.ts'
import { createScriptExamples } from './examples/scriptExamples.ts'
import { createTemplateFlows } from './examples/templateFlows.ts'
import { createWhisperClient } from './speech/speechClient.ts'

const config = loadConfig()
const embedder = createOllamaEmbedder(config.ollamaUrl, config.embedModel)
const examples = createScriptExamples(config.templateDir, embedder)
const templates = createTemplateFlows(config.templateDir, embedder)
const app = await buildApp(
    {
        config,
        llm: createOllamaClient(config.ollamaUrl, config.chatTimeoutMs),
        invokers: createInvokerRepository(config.invokerDir),
        examples,
        templates,
        embedder,
        speech: config.speechUrl ? createWhisperClient(config.speechUrl) : undefined,
    },
    { logger: { level: process.env.LOG_LEVEL ?? 'info' } },
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
        void app.close().then(() => process.exit(0))
    })
}

await app.listen({ host: config.host, port: config.port })
// Embedding every template takes seconds; doing it now keeps that wait off the first plan or build.
void Promise.all([templates.warmUp(), examples.warmUp()])
app.log.info({ model: config.workflowModel, ollama: config.ollamaUrl, invokerDir: config.invokerDir, templateDir: config.templateDir }, 'AI gateway ready')
