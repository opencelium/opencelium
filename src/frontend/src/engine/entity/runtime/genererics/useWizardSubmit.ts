import { useCallback } from 'react'
import { message } from 'antd'
import { entityRegistry } from '@/engine/entity/EntityRegistry'
import { useCreateEntityMutation, useUpdateEntityMutation } from '@/shared/api/genericApi'
import { apiExecutor } from '@shared/api/apiExecutor'
import { i18n } from '@shared/i18n/config/i18n'
import { runStage, type StageActionError } from './utils'
import type { EntityDefinition, LifecycleCtx, Mode } from '@/engine/entity/EntityDefinition'

type SubmittableMode = Extract<Mode, 'create' | 'update'>

type Args = {
    entityName: string
    mode: SubmittableMode
    identifier?: string
}

const surfaceErrors = (errors: StageActionError[]) => {
    if (!errors.length) return
    const t = i18n.getFixedT(i18n.language, 'entities')
    for (const { errorMessageKey } of errors) {
        if (errorMessageKey) message.warning(t(errorMessageKey))
    }
}

const requireEntity = (entityName: string): EntityDefinition => {
    const entity = entityRegistry.get(entityName)
    if (!entity) throw new Error(`Entity "${entityName}" not found in registry`)
    return entity
}

export function useWizardSubmit({ entityName, mode, identifier }: Args) {
    const [createTrigger] = useCreateEntityMutation()
    const [updateTrigger] = useUpdateEntityMutation()

    return useCallback(
        async (formData: unknown) => {
            const entity = requireEntity(entityName)
            const api = entity.api
            if (!api) return

            const payload = api.mapToApi ? api.mapToApi({ mode, data: formData }) : formData

            const wizardModeOnSubmit = entity.wizard?.modes?.[mode]?.onSubmit
            if (wizardModeOnSubmit) await wizardModeOnSubmit(payload)

            const baseCtx: LifecycleCtx = {
                mode,
                entity,
                payload,
                formData,
                identifier,
            }
            const lifecycle = api.lifecycle?.[mode]
            const headers = api.getHeaders?.({ mode }) ?? {}

            await runStage(lifecycle?.before, baseCtx, entity)

            const response = await runMainMutation({
                mode,
                api,
                identifier,
                payload,
                headers,
                createTrigger,
                updateTrigger,
            })

            const afterStage = await runStage(
                lifecycle?.after,
                { ...baseCtx, response },
                entity,
            )

            surfaceErrors(afterStage.errors)
        },
        [entityName, mode, identifier, createTrigger, updateTrigger],
    )
}

type MutationArgs = {
    mode: SubmittableMode
    api: NonNullable<EntityDefinition['api']>
    identifier?: string
    payload: unknown
    headers: Record<string, string>
    createTrigger: ReturnType<typeof useCreateEntityMutation>[0]
    updateTrigger: ReturnType<typeof useUpdateEntityMutation>[0]
}

async function runMainMutation({
    mode,
    api,
    identifier,
    payload,
    headers,
    createTrigger,
    updateTrigger,
}: MutationArgs): Promise<unknown> {
    if (mode === 'create') {
        const op = api.operations?.create
        if (op) {
            const url = op.buildUrl ? op.buildUrl(api.baseUrl) : api.baseUrl
            return apiExecutor({
                url,
                method: op.method ?? 'POST',
                body: payload,
                options: { headers },
            })
        }
        return createTrigger({ url: api.baseUrl, body: payload, headers }).unwrap()
    }

    if (!identifier) throw new Error('update wizard: missing identifier')
    const op = api.operations?.update
    if (op) {
        const url = op.buildUrl ? op.buildUrl(api.baseUrl, identifier) : `${api.baseUrl}/${identifier}`
        return apiExecutor({
            url,
            method: op.method ?? 'PUT',
            body: payload,
            options: { headers },
        })
    }
    return updateTrigger({ url: `${api.baseUrl}/${identifier}`, body: payload, headers }).unwrap()
}
