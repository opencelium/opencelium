import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { runtimeConfig } from '@shared/config/runtimeConfig'

const EXISTS_URL = (name: string) => `/invoker/file/exists/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/invoker'
const FETCH_URL = (id: string) => `/invoker/${encodeURIComponent(id)}`

const ACCEPT = '.xml,text/xml,application/xml'
const ALLOWED_EXTENSION = 'xml'
/** The backend's own cap; rejected here before the round trip. */
export const MAX_INVOKER_FILE_BYTES = 1024 * 1024 * 1024

const hasAllowedExtension = (name: string) =>
    name.split('.').pop()?.toLowerCase() === ALLOWED_EXTENSION

export type UploadInvokerResult =
    | { status: 'uploaded'; methodCount: number; authType?: string; version?: string }
    | { status: 'cancelled' }
    | { status: 'invalidType' }
    | { status: 'tooLarge' }

async function uploadFile(file: File): Promise<{ id: string }> {
    const token = selectAccessToken(store.getState())
    const baseUrl = runtimeConfig.apiUrl
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${baseUrl}${UPLOAD_URL}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as { id: string }
}

/** Open the native file picker and resolve with the chosen file (or null if cancelled). */
export function pickInvokerFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = ACCEPT
        input.style.display = 'none'
        input.onchange = () => {
            resolve(input.files?.[0] ?? null)
            input.remove()
        }
        document.body.appendChild(input)
        input.click()
    })
}

/**
 * Core upload flow shared by the list "Upload" button, the command palette, and the
 * onboarding tour — every entry point funnels through here so the .xml/1 GB rule is
 * enforced once, regardless of how the file was picked (file dialog or drag-and-drop
 * bypass the file dialog's own `accept` filter).
 * `confirmReplace` is awaited only when an invoker with the same filename already
 * exists; returning false aborts the upload. Refreshes the invoker list on success.
 */
export async function uploadInvoker(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<UploadInvokerResult> {
    if (!hasAllowedExtension(file.name)) return { status: 'invalidType' }
    if (file.size > MAX_INVOKER_FILE_BYTES) return { status: 'tooLarge' }

    const existsRes = (await apiExecutor({
        url: EXISTS_URL(file.name),
        method: 'GET',
    })) as { result: boolean }

    if (existsRes?.result === true) {
        const ok = await confirmReplace()
        if (!ok) return { status: 'cancelled' }
    }

    const { id } = await uploadFile(file)
    const invoker = (await apiExecutor({ url: FETCH_URL(id), method: 'GET' })) as {
        authType?: string
        operations?: unknown[]
    }
    const xml = new DOMParser().parseFromString(await file.text(), 'application/xml')
    const rawVersion = xml.documentElement.getAttribute('version') ?? undefined
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity', id: '/invoker/all' }] as never))
    return {
        status: 'uploaded',
        methodCount: invoker.operations?.length ?? 0,
        authType: invoker.authType,
        version: rawVersion ? (rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`) : undefined,
    }
}
