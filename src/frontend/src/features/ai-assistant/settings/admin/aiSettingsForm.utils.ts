import type { AiFeatureId, AiGatewaySettings, AiModelRole } from '@features/ai-assistant/model/aiGateway.types'
import { AI_FEATURE_IDS } from '@features/ai-assistant/model/aiFeatures'
import type { AiSettingsFormValues } from './aiSettingsForm.schema'

const MINUTE_MS = 60_000

export const toFormValues = (settings: AiGatewaySettings): AiSettingsFormValues => ({
    workflowModel: settings.workflowModel,
    helpModel: settings.helpModel,
    lightModel: settings.lightModel,
    commandModel: settings.commandModel,
    // Every feature has a field on the page; one missing here would make the untouched form read as changed.
    featureModels: Object.fromEntries(AI_FEATURE_IDS.map((id) => [id, settings.featureModels[id] ?? ''])),
    disabledFeatures: [...settings.disabledFeatures],
    ollamaUrl: settings.ollamaUrl,
    speechUrl: settings.speechUrl,
    chatTimeoutMinutes: Math.max(1, Math.round(settings.chatTimeoutMs / MINUTE_MS)),
    contextTokens: settings.contextTokens,
    maxRepairAttempts: settings.maxRepairAttempts,
    docsUrl: settings.docsUrl,
})

export const toGatewaySettings = (values: AiSettingsFormValues): AiGatewaySettings => ({
    workflowModel: values.workflowModel.trim(),
    helpModel: values.helpModel.trim(),
    lightModel: values.lightModel.trim(),
    commandModel: values.commandModel.trim(),
    featureModels: Object.fromEntries(Object.entries(values.featureModels)
        .filter((entry): entry is [AiFeatureId, string] => Boolean(entry[1]?.trim()))),
    disabledFeatures: values.disabledFeatures,
    ollamaUrl: values.ollamaUrl.trim(),
    speechUrl: values.speechUrl.trim(),
    chatTimeoutMs: values.chatTimeoutMinutes * MINUTE_MS,
    contextTokens: values.contextTokens,
    maxRepairAttempts: values.maxRepairAttempts,
    docsUrl: values.docsUrl.trim(),
})

/** Ollama lists tags in full ("nomic-embed-text:latest"); a bare name means :latest. */
export const isInstalled = (installed: string[], model: string) =>
    installed.includes(model) || installed.includes(`${model}:latest`)

const LARGE_MODELS = ['qwen2.5-coder:14b', 'mistral-small3.2:24b'] as const
const SMALL_MODELS = ['qwen2.5-coder:7b', 'gemma3:12b'] as const

/** The models tested for each role (eval-results/compare-2026-11-16); the picker offers only these. */
export const ROLE_MODELS: Record<AiModelRole, readonly string[]> = {
    workflowModel: LARGE_MODELS,
    helpModel: LARGE_MODELS,
    lightModel: SMALL_MODELS,
    commandModel: SMALL_MODELS,
}

/** The role's models, plus a chosen one outside them, so a model set before stays visible and is not changed by accident. */
export const modelChoices = (offered: readonly string[], chosen: string[]) =>
    [...new Set([...offered, ...chosen.filter(Boolean)])]
