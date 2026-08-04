// Deploy-time overridable settings, fetched from /public/config.json at app startup
// (see loadRuntimeConfig, awaited in main.tsx before the app renders). Because it's
// fetched rather than baked into the bundle, editing config.json in a deployed
// dist/ output repoints the app at a different backend/websocket host — no rebuild
// needed. Falls back to the build-time VITE_* env vars if the fetch fails, so local
// dev keeps working even without a config.json present.
export type OcServerSettings = {
    protocol?: string
    hostname?: string
    port?: string | number
    prefix?: string
}

export type OcRuntimeConfig = {
    server?: OcServerSettings
    socket?: OcServerSettings
}

export const runtimeConfig = {
    apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '',
    socketUrl: import.meta.env.VITE_SOCKET_URL as string | undefined,
}

const buildOrigin = (settings: OcServerSettings | undefined) => {
    const protocol = settings?.protocol || window.location.protocol
    const hostname = settings?.hostname || window.location.hostname
    const port = settings?.port
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}

export async function loadRuntimeConfig(): Promise<void> {
    try {
        const response = await fetch('/config.json', { cache: 'no-store' })
        if (!response.ok) return
        const settings = (await response.json()) as OcRuntimeConfig

        const serverPrefix = settings.server?.prefix?.trim() || '/'
        runtimeConfig.apiUrl = `${buildOrigin(settings.server)}${serverPrefix}`.replace(/\/+$/, '')

        const socketPrefix = settings.socket?.prefix?.trim() || ''
        runtimeConfig.socketUrl = `${buildOrigin(settings.socket)}${socketPrefix}`
    } catch {
        // config.json missing/unreachable — keep the VITE_* dev fallback above.
    }
}
