import { i18n } from '@shared/i18n/config/i18n'
import type { ApiRequestDescriptor } from '@shared/errors/types'

const OPERATION_BY_METHOD: Record<string, string> = {
    GET: 'load',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
}

/** '/connector/all?page=1' → 'connector'; also copes with absolute URLs. */
const resourceSegment = (url: string): string | undefined => {
    const path = url.replace(/^https?:\/\/[^/]+/i, '')
    return path.split(/[?#]/)[0].split('/').find(Boolean)
}

/**
 * "Could not load Connectors" — the operation the user was actually waiting on,
 * so a failed request says what broke instead of restating its status code.
 *
 * The resource name is the entity's own registered list title, already
 * translated alongside the rest of that entity, so this cannot drift from what
 * the UI calls the thing. A path with no entity behind it (`/config`,
 * `/totp-validate`) falls back to the raw segment, which is still more use than
 * nothing. Returns undefined when there is no segment to name at all.
 */
export const describeApiRequest = ({ method, url }: ApiRequestDescriptor): string | undefined => {
    const segment = resourceSegment(url)
    if (!segment) return undefined

    const titleKey = `${segment}.list.title`
    const resource = i18n.exists(titleKey, { ns: 'entities' })
        ? i18n.getFixedT(i18n.language, 'entities')(titleKey)
        : segment
    const operation = OPERATION_BY_METHOD[(method ?? 'GET').toUpperCase()] ?? 'request'

    return i18n.getFixedT(i18n.language, 'error')(`api.operation.${operation}`, { resource })
}
