import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'

const CHECK_URL = (name: string) => `/template/check/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/template'
const FETCH_URL = (id: string) => `/template/${encodeURIComponent(id)}`

const ACCEPT = '.json,.zip,application/json,application/zip'

/** Existence is checked by the bare template name, so drop a trailing upload extension. */
const stripTemplateExtension = (fileName: string) => fileName.replace(/\.(json|zip)$/i, '')

async function uploadFile(file: File): Promise<{ id: string; path: string }> {
    const token = selectAccessToken(store.getState())
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${baseUrl}${UPLOAD_URL}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as { id: string; path: string }
}

/** Open the native file picker and resolve with the chosen file (or null if cancelled). */
export function pickConnectionTemplateFile(): Promise<File | null> {
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
 * Core upload flow shared by the list "Upload" button and the command palette.
 * `confirmReplace` is awaited only when a template with the same filename already
 * exists; returning false aborts the upload. Refreshes the template list on success.
 * Resolves to `true` when the file was uploaded, `false` when the user aborted.
 */
export async function uploadConnectionTemplate(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<boolean> {
    const exists = (await apiExecutor({
        url: CHECK_URL(stripTemplateExtension(file.name)),
        method: 'GET',
    })) as boolean

    if (exists === true) {
        const ok = await confirmReplace()
        if (!ok) return false
    }

    const { id } = await uploadFile(file)
    await apiExecutor({ url: FETCH_URL(id), method: 'GET' })
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity' as any, id: '/template/all' }]))
    return true
}
