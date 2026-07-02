import { apiExecutor } from '@shared/api/apiExecutor'
import { buildInvokerXml } from '@entities/invoker/lib/invokerXml'
import { mapInvokerToForm } from '@entities/invoker/lib/mapInvokerToForm'
import type { Invoker } from '@entities/invoker/model/types'

function triggerXmlDownload(filename: string, xml: string) {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.endsWith('.xml') ? filename : `${filename}.xml`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

/** Fetches an invoker by name, rebuilds its XML representation, and triggers a browser download. */
export async function downloadInvoker(name: string): Promise<string> {
    const invoker = (await apiExecutor({
        url: `/invoker/${encodeURIComponent(name)}`,
        method: 'GET',
    })) as Invoker

    const xml = buildInvokerXml(mapInvokerToForm(invoker) as unknown as Record<string, unknown>)
    const filename = invoker?.name ?? name
    triggerXmlDownload(filename, xml)
    return filename
}
