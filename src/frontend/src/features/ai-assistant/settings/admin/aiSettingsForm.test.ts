import { describe, expect, it } from 'vitest'
import type { AiGatewaySettings } from '@features/ai-assistant/model/aiGateway.types'
import { aiSettingsFormSchema } from './aiSettingsForm.schema'
import { modelChoices, toFormValues, toGatewaySettings } from './aiSettingsForm.utils'

const settings: AiGatewaySettings = {
    workflowModel: 'qwen2.5-coder:14b', helpModel: 'qwen2.5-coder:14b', lightModel: 'qwen2.5-coder:7b', commandModel: 'qwen2.5-coder:7b',
    featureModels: { help: 'qwen3:14b' }, disabledFeatures: ['invoker-from-docs'],
    ollamaUrl: 'http://127.0.0.1:11434', speechUrl: '', chatTimeoutMs: 15 * 60_000, contextTokens: 16384, maxRepairAttempts: 2,
    docsUrl: 'https://docs.opencelium.io/en/prod',
}

describe('AI settings form', () => {
    it('round-trips the gateway settings, with the timeout in minutes', () => {
        const values = toFormValues(settings)
        expect(values.chatTimeoutMinutes).toBe(15)
        expect(values.featureModels).toMatchObject({ help: 'qwen3:14b', 'explain-workflow': '' })
        expect(toGatewaySettings(values)).toEqual(settings)
    })

    it('drops a feature model left on its role\'s default', () => {
        const values = { ...toFormValues(settings), featureModels: { help: '', 'explain-workflow': 'qwen3:14b' } }
        expect(toGatewaySettings(values).featureModels).toEqual({ 'explain-workflow': 'qwen3:14b' })
    })

    it('rejects a non-http URL and a number out of range, with codes the page translates', () => {
        const result = aiSettingsFormSchema.safeParse({ ...toFormValues(settings), ollamaUrl: 'ftp://x', contextTokens: 10 })
        expect(result.success).toBe(false)
        const messages = Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]))
        expect(messages).toEqual({ ollamaUrl: 'url', contextTokens: 'range' })
    })

    it('accepts an empty speech URL, which turns speech to text off', () => {
        expect(aiSettingsFormSchema.safeParse({ ...toFormValues(settings), speechUrl: '' }).success).toBe(true)
    })

    it('offers the installed models and keeps a chosen one Ollama lacks', () => {
        expect(modelChoices(['a:latest', 'b'], ['a', 'c'])).toEqual(['a:latest', 'b', 'c'])
    })
})
