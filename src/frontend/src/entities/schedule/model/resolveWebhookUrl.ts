import { runtimeConfig } from '@shared/config/runtimeConfig'

// Backend returns webhook.url as a dot-relative path (e.g. "./webhook/execute/<uuid>").
// Naively concatenating the API base URL + url produces "http://host:port./webhook/...";
// strip the leading dot(s) before joining so the result is a clean absolute URL.
export function resolveWebhookUrl(path: string): string {
    const baseUrl = runtimeConfig.apiUrl.replace(/\/+$/, '')
    const normalizedPath = path.replace(/^\.+/, '')
    return `${baseUrl}${normalizedPath}`
}
