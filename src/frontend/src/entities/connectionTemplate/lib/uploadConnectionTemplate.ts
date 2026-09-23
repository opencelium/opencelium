import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { runtimeConfig } from '@shared/config/runtimeConfig'

const CHECK_URL = (name: string) => `/template/check/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/template'
const UPLOAD_ARCHIVE_URL = '/storage/template/zip'
const FETCH_URL = (id: string) => `/template/${encodeURIComponent(id)}`

export const TEMPLATE_FILE_ACCEPT = '.json,.zip,application/json,application/zip'
/** The backend's own cap; rejected here before the round trip. */
export const MAX_TEMPLATE_FILE_BYTES = 1024 * 1024 * 1024 // 1 GB

type TemplateFileKind = 'json' | 'zip'

type StoredTemplate = { id: string; path: string }

const getTemplateFileKind = (name: string): TemplateFileKind | null => {
    const extension = name.split('.').pop()?.toLowerCase()
    return extension === 'json' || extension === 'zip' ? extension : null
}

export type UploadConnectionTemplateResult =
    | { status: 'uploaded'; id: string }
    | { status: 'uploadedArchive'; ids: string[] }
    | { status: 'emptyArchive' }
    | { status: 'cancelled' }
    | { status: 'invalidType' }
    | { status: 'tooLarge' }
    | { status: 'archiveTooLarge' }

/** Existence is checked by the bare template name, so drop a trailing upload extension. */
export const stripTemplateExtension = (fileName: string) => fileName.replace(/\.(json|zip)$/i, '')

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

const invalidateTemplateList = () =>
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity', id: '/template/all' }] as never))

/** Open the native file picker and resolve with the chosen file (or null if cancelled). */
export function pickConnectionTemplateFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = TEMPLATE_FILE_ACCEPT
        input.style.display = 'none'
        input.onchange = () => {
            resolve(input.files?.[0] ?? null)
            input.remove()
        }
        document.body.appendChild(input)
        input.click()
    })
}

async function uploadJsonTemplate(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<UploadConnectionTemplateResult> {
    const exists = (await apiExecutor({
        url: CHECK_URL(stripTemplateExtension(file.name)),
        method: 'GET',
    })) as boolean

    if (exists === true) {
        const ok = await confirmReplace()
        if (!ok) return { status: 'cancelled' }
    }

    const { id } = await postFile<StoredTemplate>(UPLOAD_URL, file)
    await apiExecutor({ url: FETCH_URL(id), method: 'GET' })
    invalidateTemplateList()
    return { status: 'uploaded', id }
}

/** The archive's inner template names are unknown up front, so there is no replace check. */
async function uploadTemplateArchive(file: File): Promise<UploadConnectionTemplateResult> {
    const stored = await postFile<StoredTemplate[]>(UPLOAD_ARCHIVE_URL, file)
    if (stored.length === 0) return { status: 'emptyArchive' }
    invalidateTemplateList()
    return { status: 'uploadedArchive', ids: stored.map(({ id }) => id) }
}

/**
 * Core upload flow shared by the list "Upload" button, the command palette, and the
 * workflow editor's Load Template dialog — every entry point funnels through here so
 * the .json/.zip + 1 GB rule is enforced once, regardless of how the file was picked.
 * A .json file is a single template; a .zip is an archive of template .json files.
 * `confirmReplace` is awaited only when a single template with the same filename
 * already exists; returning false aborts the upload. Refreshes the template list on success.
 */
export async function uploadConnectionTemplate(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<UploadConnectionTemplateResult> {
    const kind = getTemplateFileKind(file.name)
    if (!kind) return { status: 'invalidType' }
    if (file.size > MAX_TEMPLATE_FILE_BYTES) {
        return { status: kind === 'zip' ? 'archiveTooLarge' : 'tooLarge' }
    }

    switch (kind) {
        case 'json':
            return uploadJsonTemplate(file, confirmReplace)
        case 'zip':
            return uploadTemplateArchive(file)
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}
