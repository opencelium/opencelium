import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import { apiExecutor } from '@shared/api/apiExecutor'
import { baseApi } from '@shared/api/baseApi'
import { runtimeConfig } from '@shared/config/runtimeConfig'

const EXISTS_URL = (name: string) => `/invoker/file/exists/${encodeURIComponent(name)}`
const UPLOAD_URL = '/storage/invoker'
const FETCH_URL = (id: string) => `/invoker/${encodeURIComponent(id)}`

const ACCEPT = '.xml,text/xml,application/xml'

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
 * Core upload flow shared by the list "Upload" button and the command palette.
 * `confirmReplace` is awaited only when an invoker with the same filename already
 * exists; returning false aborts the upload. Refreshes the invoker list on success.
 * Resolves to `true` when the file was uploaded, `false` when the user aborted.
 */
export async function uploadInvoker(
    file: File,
    confirmReplace: () => Promise<boolean>,
): Promise<boolean> {
    const existsRes = (await apiExecutor({
        url: EXISTS_URL(file.name),
        method: 'GET',
    })) as { result: boolean }

    if (existsRes?.result === true) {
        const ok = await confirmReplace()
        if (!ok) return false
    }

    const { id } = await uploadFile(file)
    await apiExecutor({ url: FETCH_URL(id), method: 'GET' })
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Entity' as any, id: '/invoker/all' }]))
    return true
}
