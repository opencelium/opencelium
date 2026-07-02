import type { Invoker } from '@entities/invoker/model/types'

export function mapInvokerToForm(model: Invoker) {
    const requiredData = Object.entries(model.requiredData ?? {}).map(([key, value]) => ({
        name: key,
        visibility: 'public' as const,
        value: value ?? '',
    }))

    const operations = (model.operations ?? []).map((op) => ({
        name: op.name ?? '',
        endpoint: op.request?.endpoint ?? '',
        method: op.request?.method ?? 'GET',
        testConnection: op.type === 'test',
        request: {
            headersJson: JSON.stringify(op.request?.header ?? {}, null, 2),
            data: op.request?.body?.data ?? 'raw',
            format: op.request?.body?.format ?? 'json',
            type: op.request?.body?.type ?? 'object',
            bodyJson: JSON.stringify(op.request?.body?.fields ?? {}, null, 2),
        },
        response: {
            success: {
                status: op.response?.success?.status ?? '',
                headersJson: JSON.stringify(op.response?.success?.header ?? {}, null, 2),
                data: op.response?.success?.body?.data ?? 'raw',
                format: op.response?.success?.body?.format ?? 'json',
                type: op.response?.success?.body?.type ?? 'object',
                bodyJson: JSON.stringify(op.response?.success?.body?.fields ?? {}, null, 2),
            },
            fail: {
                status: op.response?.fail?.status ?? '',
                headersJson: JSON.stringify(op.response?.fail?.header ?? {}, null, 2),
                data: op.response?.fail?.body?.data ?? 'raw',
                format: op.response?.fail?.body?.format ?? 'json',
                type: op.response?.fail?.body?.type ?? 'object',
                bodyJson: JSON.stringify(op.response?.fail?.body?.fields ?? {}, null, 2),
            },
        },
    }))

    return {
        ...model,
        requiredData,
        operations,
    }
}
