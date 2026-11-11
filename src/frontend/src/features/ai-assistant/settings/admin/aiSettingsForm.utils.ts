import type { AiFeatureId, AiGatewaySettings } from '@features/ai-assistant/model/aiGateway.types'
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

/** The installed models, plus the chosen one when Ollama does not have it, so the picker can still show it. */
export const modelChoices = (installed: string[], chosen: string[]) =>
    [...new Set([...installed, ...chosen.filter((model) => model && !isInstalled(installed, model))])]
