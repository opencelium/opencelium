import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { z } from 'zod'
import type { GatewayConfig } from '../config.ts'
import { AI_FEATURES, type AiFeature } from '../featureModels.ts'

const modelName = z.string().trim().min(1).max(200)
const httpUrl = z.string().trim().url().refine((url) => /^https?:\/\//.test(url), 'Use an http(s) URL').transform((url) => url.replace(/\/+$/, ''))
const feature = z.enum(AI_FEATURES as [AiFeature, ...AiFeature[]])

/** What the AI settings page may change; everything else stays the environment's. */
export const gatewaySettingsSchema = z.object({
    workflowModel: modelName,
    helpModel: modelName,
    lightModel: modelName,
    commandModel: modelName,
    featureModels: z.partialRecord(feature, modelName),
    disabledFeatures: z.array(feature).transform((list) => [...new Set(list)]),
    ollamaUrl: httpUrl,
    /** Empty turns speech to text off. */
    speechUrl: z.union([z.literal(''), httpUrl]),
    chatTimeoutMs: z.number().int().min(60_000).max(60 * 60_000),
    contextTokens: z.number().int().min(2048).max(131_072),
    maxRepairAttempts: z.number().int().min(0).max(5),
    docsUrl: httpUrl,
})

export type GatewaySettings = z.infer<typeof gatewaySettingsSchema>

const SETTING_KEYS = Object.keys(gatewaySettingsSchema.shape) as (keyof GatewaySettings)[]

export const pickSettings = (config: GatewayConfig): GatewaySettings => ({
    workflowModel: config.workflowModel,
    helpModel: config.helpModel,
    lightModel: config.lightModel,
    commandModel: config.commandModel,
    featureModels: { ...config.featureModels },
    disabledFeatures: [...config.disabledFeatures],
    ollamaUrl: config.ollamaUrl,
    speechUrl: config.speechUrl,
    chatTimeoutMs: config.chatTimeoutMs,
    contextTokens: config.contextTokens,
    maxRepairAttempts: config.maxRepairAttempts,
    docsUrl: config.docsUrl,
})

const isSame = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)

/** Only what differs from the environment is stored, so a value nobody changed keeps following the environment. */
export const settingsOverrides = (settings: GatewaySettings, defaults: GatewaySettings): Partial<GatewaySettings> =>
    Object.fromEntries(SETTING_KEYS.filter((key) => !isSame(settings[key], defaults[key])).map((key) => [key, settings[key]]))

export type SettingsStore = {
    /** The environment's values, for "Reset to defaults". */
    defaults: GatewaySettings
    current(): GatewaySettings
    /** Validated settings in; applied at once (the routes read the config on every request) and kept in the file. */
    update(next: GatewaySettings): Promise<GatewaySettings>
}

/**
 * The AI settings page's changes on top of the environment. They are applied to the config object every route reads, so
 * a change counts from the next request on, without a restart. A stored file that no longer validates (an older gateway
 * wrote it, a feature was renamed) is ignored key by key rather than keeping the gateway from starting.
 */
export async function createSettingsStore(config: GatewayConfig, file: string | null, log: (message: string) => void = () => {}): Promise<SettingsStore> {
    const defaults = pickSettings(config)
    if (file) {
        const stored = await readStored(file, log)
        const merged = { ...defaults, ...stored }
        const parsed = gatewaySettingsSchema.safeParse(merged)
        if (parsed.success) Object.assign(config, parsed.data)
        else log(`Ignoring ${file}: ${parsed.error.message}`)
    }
    return {
        defaults,
        current: () => pickSettings(config),
        async update(next) {
            if (file) {
                await mkdir(dirname(file), { recursive: true })
                await writeFile(file, `${JSON.stringify(settingsOverrides(next, defaults), null, 2)}\n`)
            }
            Object.assign(config, next)
            return pickSettings(config)
        },
    }
}

async function readStored(file: string, log: (message: string) => void): Promise<Partial<GatewaySettings>> {
    let text: string
    try {
        text = await readFile(file, 'utf8')
    } catch {
        return {}
    }
    try {
        const value: unknown = JSON.parse(text)
        if (!value || typeof value !== 'object') return {}
        const shape = gatewaySettingsSchema.shape
        return Object.fromEntries(Object.entries(value).filter(([key, entry]) =>
            key in shape && shape[key as keyof GatewaySettings].safeParse(entry).success))
    } catch {
        log(`Ignoring ${file}: not valid JSON`)
        return {}
    }
}
