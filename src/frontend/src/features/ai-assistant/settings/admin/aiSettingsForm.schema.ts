import { z } from 'zod'
import { AI_FEATURE_IDS } from '@features/ai-assistant/model/aiFeatures'

const modelName = z.string().trim().min(1, 'model')
const httpUrl = z.string().trim().regex(/^https?:\/\/[^\s/]+[^\s]*$/, 'url')
const wholeNumber = (min: number, max: number) => z.number({ error: 'range' }).int('range').min(min, 'range').max(max, 'range')
const feature = z.enum(AI_FEATURE_IDS)

/** Limits the page shows next to the number fields; the same ones the gateway checks. */
export const AI_SETTINGS_LIMITS = {
    chatTimeoutMinutes: { min: 1, max: 60 },
    contextTokens: { min: 2048, max: 131072 },
    maxRepairAttempts: { min: 0, max: 5 },
} as const

/** The admin part of the AI settings page. Error messages are i18n keys under `ai-settings.admin.errors`. */
export const aiSettingsFormSchema = z.object({
    workflowModel: modelName,
    helpModel: modelName,
    lightModel: modelName,
    commandModel: modelName,
    /** An empty model: the feature runs on its role's model. */
    featureModels: z.partialRecord(feature, z.string().optional()),
    disabledFeatures: z.array(feature),
    ollamaUrl: httpUrl,
    speechUrl: z.union([z.literal(''), httpUrl]),
    chatTimeoutMinutes: wholeNumber(AI_SETTINGS_LIMITS.chatTimeoutMinutes.min, AI_SETTINGS_LIMITS.chatTimeoutMinutes.max),
    contextTokens: wholeNumber(AI_SETTINGS_LIMITS.contextTokens.min, AI_SETTINGS_LIMITS.contextTokens.max),
    maxRepairAttempts: wholeNumber(AI_SETTINGS_LIMITS.maxRepairAttempts.min, AI_SETTINGS_LIMITS.maxRepairAttempts.max),
    docsUrl: httpUrl,
})

export type AiSettingsFormValues = z.infer<typeof aiSettingsFormSchema>
