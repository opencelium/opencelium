// Reads the deploy-time overridable settings from window.__OC_CONFIG__ (set by
// /public/config.js, loaded via a <script> tag ahead of the app bundle in
// index.html — see that file). Falls back to the build-time VITE_* env vars so
// local dev keeps working if config.js is left at its checked-in default.
export type OcRuntimeConfig = {
    API_URL?: string
    SOCKET_URL?: string
}

declare global {
    interface Window {
        __OC_CONFIG__?: OcRuntimeConfig
    }
}

const windowConfig = typeof window !== 'undefined' ? window.__OC_CONFIG__ : undefined

export const runtimeConfig = {
    apiUrl: windowConfig?.API_URL ?? (import.meta.env.VITE_API_URL as string | undefined) ?? '',
    socketUrl: windowConfig?.SOCKET_URL ?? (import.meta.env.VITE_SOCKET_URL as string | undefined),
}
