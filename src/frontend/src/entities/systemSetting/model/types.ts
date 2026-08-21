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
