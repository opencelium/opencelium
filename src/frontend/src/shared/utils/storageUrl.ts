import { runtimeConfig } from '@shared/config/runtimeConfig'

/**
 * Resolves a path the backend hands out for a stored file (`./storage/files/<uuid>.png`)
 * into something an `<img src>` can load. The API base is only known at runtime, so it
 * cannot be baked into the stored value — and `/storage/files/**` is served without auth,
 * which is what lets a resolved URL work on the login screen too.
 *
 * Anything already loadable (blob:, data:, absolute http(s)) and anything that isn't a
 * storage path is returned untouched, so callers can pass a value of unknown provenance.
 */
export const resolveStorageUrl = (path?: string | null): string | null => {
    if (!path?.trim()) return null
    if (/^(blob:|data:|https?:\/\/)/i.test(path)) return path

    const normalized = path.replace(/^\.\//, '')
    if (!normalized.startsWith('storage/')) return path

    return `${runtimeConfig.apiUrl.replace(/\/$/, '')}/${normalized}`
}
