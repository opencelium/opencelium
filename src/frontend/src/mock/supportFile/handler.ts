import { http, HttpResponse } from 'msw'
import type { SupportFile } from '@entities/supportFile/model/types'

let supportFiles: SupportFile[] = [
    {
        connectionId: 17,
        connectionTitle: null,
        supportFile: '/connection/support-file/17/2026-03-11_16-37_17_f_15.zip',
        status: 'CONNECTION_IS_MISSING',
        message: 'Connection not found.',
    },
    {
        connectionId: 18,
        connectionTitle: null,
        supportFile: '/connection/support-file/18/2026-03-11_16-59_18_s_16.zip',
        status: 'CONNECTION_IS_MISSING',
        message: 'Connection not found.',
    },
    {
        connectionId: 68,
        connectionTitle: 'test',
        supportFile: '/connection/support-file/68/2026-05-06_10-11_68_f_82.zip',
        status: 'CONNECTION_FOUND',
        message: 'Connection is found.',
    },
    {
        connectionId: 68,
        connectionTitle: 'test',
        supportFile: '/connection/support-file/68/2026-05-06_10-12_68_f_83.zip',
        status: 'CONNECTION_FOUND',
        message: 'Connection is found.',
    },
]

function basename(path: string): string {
    const slash = path.lastIndexOf('/')
    return slash === -1 ? path : path.slice(slash + 1)
}

function buildZipBlob(): Blob {
    // Minimal valid empty-zip header (PK\x05\x06 + 18 zero bytes).
    const eocd = new Uint8Array([
        0x50, 0x4b, 0x05, 0x06,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
    return new Blob([eocd], { type: 'application/octet-stream' })
}

export const supportFileHandlers = [
    http.get('/connection/support-file/list', () => {
        return HttpResponse.json(supportFiles)
    }),

    http.get('/connection/support-file/:connectionId/:filename', () => {
        return new HttpResponse(buildZipBlob(), {
            headers: { 'Content-Type': 'application/octet-stream' },
        })
    }),

    http.delete('/connection/support-file/:filename', ({ params }) => {
        const filename = String(params.filename ?? '')
        supportFiles = supportFiles.filter((f) => basename(f.supportFile) !== filename)
        return HttpResponse.json({ valid: true })
    }),

    http.put('/connection/support-file/delete/list', async ({ request }) => {
        const body = (await request.json()) as { filenames?: string[] }
        const filenames = new Set(body.filenames ?? [])
        supportFiles = supportFiles.filter((f) => !filenames.has(basename(f.supportFile)))
        return HttpResponse.json({ valid: true })
    }),

    http.post('/connection/execute/:connectionId/support-file', async ({ params }) => {
        const connectionId = Number(params.connectionId ?? 0)
        const filename = `2026-06-02_12-00_${connectionId}_s_99.zip`
        supportFiles = [
            ...supportFiles,
            {
                connectionId,
                connectionTitle: null,
                supportFile: `/connection/support-file/${connectionId}/${filename}`,
                status: 'CONNECTION_FOUND',
                message: 'Connection is found.',
            },
        ]
        return HttpResponse.json({ valid: true })
    }),
]
