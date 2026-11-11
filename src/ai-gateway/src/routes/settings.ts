import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import { FEATURE_MODELS } from '../featureModels.ts'
import { gatewaySettingsSchema, type GatewaySettings } from '../settings/gatewaySettings.ts'
import { sendApiError } from './apiError.ts'

export type SettingsResponse = {
    settings: GatewaySettings
    /** The environment's values, for "Reset to defaults". */
    defaults: GatewaySettings
    /** Which model role each feature belongs to, so the page can group them. */
    featureRoles: typeof FEATURE_MODELS
    /** Models Ollama has, for the pickers; empty when it cannot be reached. */
    installedModels: string[]
    embedModel: string
}

/**
 * The AI settings page's admin part. Only the app checks who may save: the gateway listens on loopback and has no auth
 * of its own yet (see README).
 */
export function registerSettingsRoutes(app: FastifyInstance, { config, llm, settings }: AppDeps) {
    if (!settings) return
    const respond = async (current: GatewaySettings): Promise<SettingsResponse> => ({
        settings: current,
        defaults: settings.defaults,
        featureRoles: FEATURE_MODELS,
        installedModels: await llm.listModels().catch(() => []),
        embedModel: config.embedModel,
    })

    app.get('/settings', async () => respond(settings.current()))

    app.put('/settings', async (request, reply) => {
        const body = gatewaySettingsSchema.safeParse(request.body)
        if (!body.success) return sendApiError(reply, 'BAD_REQUEST', 'Invalid settings', z.treeifyError(body.error))
        const saved = await settings.update(body.data)
        request.log.info({ settings: saved }, 'AI settings saved')
        return respond(saved)
    })
}
