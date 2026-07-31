import { apiExecutor } from '@shared/api/apiExecutor'
import type { ConnectionTemplate } from '@entities/connectionTemplate/model/types'

function triggerJsonDownload(filename: string, payload: unknown) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

/** Fetches a connection template by id and triggers a browser download of its JSON representation. */
export async function downloadConnectionTemplate(templateId: string | number): Promise<string> {
    const fetched = (await apiExecutor({
        url: `/template/${encodeURIComponent(String(templateId))}`,
        method: 'GET',
    })) as ConnectionTemplate

    const filename = String(fetched?.name ?? templateId)
    triggerJsonDownload(filename, fetched)
    return filename
}
