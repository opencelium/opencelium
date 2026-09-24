const GRAVATAR_SIZE = 256

const EXTENSION_BY_MIME: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
}

export const normalizeEmail = (value: unknown): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : ''

// crypto.subtle only exists in secure contexts (https / localhost); on a plain-http
// deployment the Gravatar suggestion is silently unavailable.
const sha256Hex = async (value: string): Promise<string | null> => {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) return null
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value))
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Resolves with the email's Gravatar as an uploadable File, or null when there is none.
 * `d=404` makes Gravatar answer 404 instead of a generated placeholder.
 *
 * Bare `fetch` on purpose: `apiExecutor` would attach the Bearer token and prefix the
 * API base URL — neither may reach a third-party host.
 */
export async function fetchGravatarFile(email: string): Promise<File | null> {
    const hash = await sha256Hex(normalizeEmail(email))
    if (!hash) return null
    try {
        const response = await fetch(
            `https://www.gravatar.com/avatar/${hash}?s=${GRAVATAR_SIZE}&d=404`,
            {credentials: 'omit', referrerPolicy: 'no-referrer'},
        )
        if (!response.ok) return null
        const blob = await response.blob()
        const extension = EXTENSION_BY_MIME[blob.type]
        if (!extension) return null
        return new File([blob], `gravatar.${extension}`, {type: blob.type})
    } catch {
        return null
    }
}
