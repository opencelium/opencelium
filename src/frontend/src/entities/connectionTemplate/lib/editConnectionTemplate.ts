import { z } from 'zod'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { store } from '@app/store/store'
import { i18n } from '@shared/i18n/config/i18n'
import type { JsonEditorValidation } from '@shared/ui/json-editor/JsonEditorDialog.types'

const TEMPLATE_URL = (id: string) => `/template/${encodeURIComponent(id)}`

// Loose on purpose: the backend ignores unknown keys and stores the connection as-is,
// so only the fields the list and the update endpoint rely on are enforced.
const connectionTemplateJsonSchema = z.looseObject({
    name: z.string().trim().min(1),
    description: z.string().nullable().optional(),
    version: z.string().nullable().optional(),
    connection: z.looseObject({
        title: z.string().nullable().optional(),
        fromConnector: z.looseObject({}),
    }),
})

export type ConnectionTemplateJson = z.infer<typeof connectionTemplateJsonSchema>

// apiExecutor resolves (rather than rejects) with the RTK Query error object on failure.
const isApiError = (response: unknown): boolean =>
    !!response && typeof response === 'object' && ('status' in response || 'error' in response)

export async function fetchConnectionTemplateJson(templateId: string): Promise<Record<string, unknown>> {
    const response: unknown = await apiExecutor({
        url: TEMPLATE_URL(templateId),
        method: 'GET',
        options: { ignoreError: true },
    })
    if (!response || typeof response !== 'object' || Array.isArray(response) || isApiError(response)) {
        throw new Error(`Template ${templateId} could not be loaded`)
    }
    return response as Record<string, unknown>
}

export async function updateConnectionTemplateJson(templateId: string,
    template: ConnectionTemplateJson): Promise<void> {
    const response: unknown = await apiExecutor({
        url: TEMPLATE_URL(templateId),
        method: 'PUT',
        body: template,
        options: { ignoreError: true },
    })
    if (isApiError(response)) throw new Error(`Template ${templateId} could not be updated`)
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity', id: '/template/all' }] as never))
}

/** The backend replaces the stored template by the id in the body, so editing the id is rejected. */
export function validateConnectionTemplateJson(draft: Record<string, unknown>, idField: string,
    originalId: unknown): JsonEditorValidation<ConnectionTemplateJson> {
    const t = i18n.getFixedT(i18n.language, 'entities')
    if (draft[idField] !== originalId) {
        return { success: false, errors: [{ path: idField,
            message: t('connection-template.list.edit.errors.idChanged', { path: idField }) }] }
    }
    const parsed = connectionTemplateJsonSchema.safeParse(draft)
    if (parsed.success) return { success: true, data: parsed.data }
    return {
        success: false,
        errors: parsed.error.issues.slice(0, 5).map((issue) => {
            const path = issue.path.join('.')
            return { path, message: t('connection-template.list.edit.errors.schema',
                { path: path || '-', reason: issue.message }) }
        }),
    }
}
