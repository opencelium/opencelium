import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createInvokerRepository } from './invokers/invokerRepository.ts'
import { createOllamaClient } from './llm/ollamaClient.ts'
import { createOllamaEmbedder } from './llm/ollamaEmbedder.ts'
import { createScriptExamples } from './examples/scriptExamples.ts'

const config = loadConfig()
const app = await buildApp(
    {
        config,
        llm: createOllamaClient(config.ollamaUrl),
        invokers: createInvokerRepository(config.invokerDir),
        examples: createScriptExamples(config.templateDir, createOllamaEmbedder(config.ollamaUrl, config.embedModel)),
    },
    { logger: { level: process.env.LOG_LEVEL ?? 'info' } },
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
        void app.close().then(() => process.exit(0))
    })
}

await app.listen({ host: config.host, port: config.port })
app.log.info({ model: config.workflowModel, ollama: config.ollamaUrl, invokerDir: config.invokerDir, templateDir: config.templateDir }, 'AI gateway ready')
