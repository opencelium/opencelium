import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createInvokerRepository } from './invokers/invokerRepository.ts'
import { createScriptExamples } from './examples/scriptExamples.ts'
import { createTemplateFlows } from './examples/templateFlows.ts'
import { createOperationUsages } from './examples/operationUsages.ts'
import { createOperationRanker } from './invokers/focusConnectors.ts'
import { createDocsIndex } from './help/docsIndex.ts'
import { createSettingsStore } from './settings/gatewaySettings.ts'
import { createLiveEmbedder, createLiveLlmClient, createLiveSpeechClient } from './settings/liveClients.ts'

const config = loadConfig()
// Before anything reads the config: what the AI settings page saved overrides the environment.
const settings = await createSettingsStore(config, config.settingsFile, (message) => console.warn(message))
const embedder = createLiveEmbedder(config)
const examples = createScriptExamples(config.templateDir, embedder)
const templates = createTemplateFlows(config.templateDir, embedder)
const invokers = createInvokerRepository(config.invokerDir)
const operationUsages = createOperationUsages(config.templateDir, invokers, embedder)
const docs = createDocsIndex(config.docsDir, embedder)
const app = await buildApp(
    {
        config,
        llm: createLiveLlmClient(config),
        invokers,
        examples,
        templates,
        operationUsages,
        operationRanker: createOperationRanker(embedder),
        docs,
        embedder,
        speech: createLiveSpeechClient(config),
        settings,
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
void Promise.all([templates.warmUp(), examples.warmUp(), operationUsages.warmUp(), docs.warmUp()])
app.log.info({ model: config.workflowModel, ollama: config.ollamaUrl, invokerDir: config.invokerDir, templateDir: config.templateDir }, 'AI gateway ready')
