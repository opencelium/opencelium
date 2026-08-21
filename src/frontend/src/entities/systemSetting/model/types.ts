/**
 * Global, admin-managed settings that apply to every user. The backend stores the value
 * as opaque JSON — the shape of each setting is owned entirely by the frontend, so every
 * read must be validated before use, exactly like a value coming out of localStorage.
 *
 * Reads are default-deny: only names the backend whitelists (SystemSettingSecurity) are
 * readable by non-admins. Writes are admin-only.
 */
export type SystemSettingName = 'theme_colors' | 'app_logo'

export type SystemSettingDTO<TValue = unknown> = {
    name: SystemSettingName
    value: TValue
    updatedAt: string
}

/**
 * Value of the `app_logo` setting. `filename` is the backend's internal storage key and
 * of no use to a client; `url` is the public `./storage/files/<uuid>.<ext>` path to put
 * in an `<img src>`. Validated on read like every other opaque setting value.
 */
export type AppLogoValue = {
    filename: string
    url: string
}

export const isAppLogoValue = (value: unknown): value is AppLogoValue => {
    if (typeof value !== 'object' || value === null) return false
    const { url } = value as { url?: unknown }
    return typeof url === 'string' && url.trim().length > 0
}
