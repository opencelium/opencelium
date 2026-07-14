// Backend returns webhook.url as a dot-relative path (e.g. "./webhook/execute/<uuid>").
// Naively concatenating VITE_API_URL + url produces "http://host:port./webhook/...";
// strip the leading dot(s) before joining so the result is a clean absolute URL.
export function resolveWebhookUrl(path: string): string {
    const baseUrl = ((import.meta.env.VITE_API_URL as string) ?? '').replace(/\/+$/, '')
    const normalizedPath = path.replace(/^\.+/, '')
    return `${baseUrl}${normalizedPath}`
}
