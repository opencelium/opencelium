import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { runtimeConfig } from '@shared/config/runtimeConfig'

const EXISTS_URL = (name: string) => `/invoker/file/exists/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/invoker'
const UPLOAD_ARCHIVE_URL = '/storage/invoker/zip'
const FETCH_URL = (id: string) => `/invoker/${encodeURIComponent(id)}`

export const INVOKER_FILE_ACCEPT = '.xml,.zip,text/xml,application/xml,application/zip'
/** The backend's own cap; rejected here before the round trip. */
export const MAX_INVOKER_FILE_BYTES = 1024 * 1024 * 1024

type InvokerFileKind = 'xml' | 'zip'

type StoredInvoker = { id: string; path: string }

const getInvokerFileKind = (name: string): InvokerFileKind | null => {
    const extension = name.split('.').pop()?.toLowerCase()
    return extension === 'xml' || extension === 'zip' ? extension : null
}

export type UploadInvokerResult =
    | { status: 'uploaded'; methodCount: number; authType?: string; version?: string }
    | { status: 'uploadedArchive'; ids: string[] }
    | { status: 'emptyArchive' }
    | { status: 'cancelled' }
    | { status: 'invalidType' }
    | { status: 'tooLarge' }
    | { status: 'archiveTooLarge' }

async function postFile<T>(url: string, file: File): Promise<T> {
    const token = selectAccessToken(store.getState())
    const baseUrl = runtimeConfig.apiUrl
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
}

const invalidateInvokerList = () =>
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity', id: '/invoker/all' }] as never))

/** Open the native file picker and resolve with the chosen file (or null if cancelled). */
export function pickInvokerFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = INVOKER_FILE_ACCEPT
        input.style.display = 'none'
        input.onchange = () => {
            resolve(input.files?.[0] ?? null)
            input.remove()
        }
        document.body.appendChild(input)
        input.click()
    })
}

async function uploadXmlInvoker(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<UploadInvokerResult> {
    const existsRes = (await apiExecutor({
        url: EXISTS_URL(file.name),
        method: 'GET',
    })) as { result: boolean }

    if (existsRes?.result === true) {
        const ok = await confirmReplace()
        if (!ok) return { status: 'cancelled' }
    }

    const { id } = await postFile<StoredInvoker>(UPLOAD_URL, file)
    const invoker = (await apiExecutor({ url: FETCH_URL(id), method: 'GET' })) as {
        authType?: string
        operations?: unknown[]
    }
    const xml = new DOMParser().parseFromString(await file.text(), 'application/xml')
    const rawVersion = xml.documentElement.getAttribute('version') ?? undefined
    invalidateInvokerList()
    return {
        status: 'uploaded',
        methodCount: invoker.operations?.length ?? 0,
        authType: invoker.authType,
        version: rawVersion ? (rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`) : undefined,
    }
}

/** The archive's inner file names are unknown up front, so there is no replace check. */
async function uploadInvokerArchive(file: File): Promise<UploadInvokerResult> {
    const stored = await postFile<StoredInvoker[]>(UPLOAD_ARCHIVE_URL, file)
    if (stored.length === 0) return { status: 'emptyArchive' }
    invalidateInvokerList()
    return { status: 'uploadedArchive', ids: stored.map(({ id }) => id) }
}

/**
 * Core upload flow shared by the list "Upload" button, the command palette, and the
 * onboarding tour — every entry point funnels through here so the .xml/.zip + 1 GB rule
 * is enforced once, regardless of how the file was picked (file dialog or drag-and-drop
 * bypass the file dialog's own `accept` filter).
 * An .xml file is a single invoker; a .zip is an archive of invoker .xml files.
 * `confirmReplace` is awaited only when a single invoker with the same filename already
 * exists; returning false aborts the upload. Refreshes the invoker list on success.
 */
export async function uploadInvoker(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<UploadInvokerResult> {
    const kind = getInvokerFileKind(file.name)
    if (!kind) return { status: 'invalidType' }
    if (file.size > MAX_INVOKER_FILE_BYTES) {
        return { status: kind === 'zip' ? 'archiveTooLarge' : 'tooLarge' }
    }

    switch (kind) {
        case 'xml':
            return uploadXmlInvoker(file, confirmReplace)
        case 'zip':
            return uploadInvokerArchive(file)
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}
