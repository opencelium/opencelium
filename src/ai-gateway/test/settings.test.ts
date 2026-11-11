import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { modelFor } from '../src/featureModels.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { LlmClient } from '../src/llm/llmClient.ts'
import { createSettingsStore, pickSettings } from '../src/settings/gatewaySettings.ts'

const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
const llm: LlmClient = {
    chat: async () => ({ content: '', promptTokens: 0, outputTokens: 0, durationMs: 0 }),
    listModels: async () => ['qwen2.5-coder:14b', 'qwen2.5-coder:7b', 'qwen3:14b'],
}
const tempFile = async () => join(await mkdtemp(join(tmpdir(), 'ai-settings-')), 'settings.json')

describe('AI settings', () => {
    it('applies saved settings over the environment and keeps only what differs in the file', async () => {
        const file = await tempFile()
        const config = loadConfig({})
        const store = await createSettingsStore(config, file)
        await store.update({ ...store.current(), lightModel: 'qwen3:14b', disabledFeatures: ['help'] })
        expect(config.lightModel).toBe('qwen3:14b')
        expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ lightModel: 'qwen3:14b', disabledFeatures: ['help'] })

        const restarted = loadConfig({})
        await createSettingsStore(restarted, file)
        expect(pickSettings(restarted)).toMatchObject({ lightModel: 'qwen3:14b', disabledFeatures: ['help'] })
    })

    it('ignores stored values that no longer fit, one by one', async () => {
        const file = await tempFile()
        await writeFile(file, JSON.stringify({ contextTokens: 'lots', disabledFeatures: ['gone'], docsUrl: 'https://docs.example.com/' }))
        const config = loadConfig({})
        await createSettingsStore(config, file)
        expect(config.contextTokens).toBe(16384)
        expect(config.disabledFeatures).toEqual([])
        expect(config.docsUrl).toBe('https://docs.example.com')
    })

    it('runs a feature on its own model when one is set', () => {
        const config = { ...loadConfig({}), featureModels: { 'explain-workflow': 'qwen3:14b' } }
        expect(modelFor(config, 'explain-workflow')).toBe('qwen3:14b')
        expect(modelFor(config, 'transformation-script')).toBe(config.lightModel)
    })

    it('reads and saves settings over HTTP, and reports switched-off features in /health', async () => {
        const config = loadConfig({})
        const settings = await createSettingsStore(config, null)
        const app = await buildApp({ config, llm, invokers, settings })
        const read = (await app.inject({ method: 'GET', url: '/settings' })).json()
        expect(read.installedModels).toContain('qwen3:14b')
        expect(read.defaults.workflowModel).toBe('qwen2.5-coder:14b')

        const saved = await app.inject({ method: 'PUT', url: '/settings',
            payload: { ...read.settings, disabledFeatures: ['invoker-from-docs'], featureModels: { help: 'qwen3:14b' } } })
        expect(saved.statusCode).toBe(200)
        const health = (await app.inject({ method: 'GET', url: '/health' })).json()
        expect(health.disabledFeatures).toEqual(['invoker-from-docs'])
        expect(health.features).toContainEqual({ id: 'help', model: 'qwen3:14b', available: true })
    })

    it('refuses settings that do not validate', async () => {
        const config = loadConfig({})
        const app = await buildApp({ config, llm, invokers, settings: await createSettingsStore(config, null) })
        const current = (await app.inject({ method: 'GET', url: '/settings' })).json().settings
        const response = await app.inject({ method: 'PUT', url: '/settings', payload: { ...current, ollamaUrl: 'ftp://x', contextTokens: 10 } })
        expect(response.statusCode).toBe(400)
        expect(config.ollamaUrl).toBe('http://127.0.0.1:11434')
    })
})

describe('AI settings over CORS', () => {
    it('lets the app send PUT /settings from its origin', async () => {
        const config = loadConfig({})
        const app = await buildApp({ config, llm, invokers, settings: await createSettingsStore(config, null) })
        const preflight = await app.inject({ method: 'OPTIONS', url: '/settings', headers: {
            origin: 'http://localhost:5173', 'access-control-request-method': 'PUT' } })
        expect(preflight.headers['access-control-allow-methods']).toContain('PUT')
    })
})
