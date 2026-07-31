function escapeXml(value: string): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function objectToXmlFields(obj: unknown, indent: string): string {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return ''
    return Object.entries(obj as Record<string, unknown>)
        .map(([key, value]) => {
            let type: string
            if (Array.isArray(value)) type = 'array'
            else if (value === null || value === undefined) type = 'string'
            else if (typeof value === 'object') type = 'object'
            else if (typeof value === 'number') type = 'number'
            else if (typeof value === 'boolean') type = 'boolean'
            else type = 'string'
            return `${indent}<field name="${escapeXml(key)}" type="${type}"/>`
        })
        .join('\n')
}

function parseJsonSafe(raw: unknown): unknown {
    if (raw && typeof raw === 'object') return raw
    try {
        return JSON.parse(String(raw ?? '{}'))
    } catch {
        return {}
    }
}

function buildBodySection(section: Record<string, unknown>, indent: string): string {
    const data = String(section.data ?? 'raw')
    const format = String(section.format ?? 'json')
    const type = String(section.type ?? 'object')
    const body = parseJsonSafe(section.bodyJson)
    const fieldsXml = objectToXmlFields(body, indent + '    ')
    const innerContent = fieldsXml ? `\n${fieldsXml}\n${indent}` : ''
    return `<body data="${data}" format="${format}" type="${type}">${innerContent}</body>`
}

export function buildInvokerXml(data: Record<string, unknown>): string {
    const requiredData = (data.requiredData as { name: string; visibility: string; value: string }[]) ?? []
    const operations = (data.operations as Record<string, unknown>[]) ?? []

    const requiredDataXml = requiredData
        .map(
            (item) =>
                `        <item name="${escapeXml(item.name)}" type="text" visibility="${escapeXml(item.visibility)}"/>`
        )
        .join('\n')

    const operationsXml = operations
        .map((op) => {
            const testAttr = op.testConnection ? ' type="test"' : ''
            const req = (op.request ?? {}) as Record<string, unknown>
            const res = (op.response ?? {}) as Record<string, unknown>
            const success = (res.success ?? {}) as Record<string, unknown>
            const fail = (res.fail ?? {}) as Record<string, unknown>

            const reqHeaders = parseJsonSafe(req.headersJson) as Record<string, string>
            const successHeaders = parseJsonSafe(success.headersJson) as Record<string, string>
            const failHeaders = parseJsonSafe(fail.headersJson) as Record<string, string>

            const reqHeadersXml = Object.entries(reqHeaders)
                .map(([k, v]) => `                <header name="${escapeXml(k)}" value="${escapeXml(v)}"/>`)
                .join('\n')
            const successHeadersXml = Object.entries(successHeaders)
                .map(([k, v]) => `                    <header name="${escapeXml(k)}" value="${escapeXml(v)}"/>`)
                .join('\n')
            const failHeadersXml = Object.entries(failHeaders)
                .map(([k, v]) => `                    <header name="${escapeXml(k)}" value="${escapeXml(v)}"/>`)
                .join('\n')

            return `        <operation name="${escapeXml(String(op.name ?? ''))}"${testAttr}>
            <request>
                <method>${escapeXml(String(op.method ?? 'GET'))}</method>
                <endpoint>${escapeXml(String(op.endpoint ?? ''))}</endpoint>
                ${reqHeadersXml ? `<headers>\n${reqHeadersXml}\n                </headers>` : '<headers/>'}
                ${buildBodySection(req, '                ')}
            </request>
            <response>
                <success status="${escapeXml(String(success.status ?? '200'))}">
                    ${successHeadersXml ? `<headers>\n${successHeadersXml}\n                    </headers>` : '<headers/>'}
                    ${buildBodySection(success, '                    ')}
                </success>
                <fail status="${escapeXml(String(fail.status ?? '400'))}">
                    ${failHeadersXml ? `<headers>\n${failHeadersXml}\n                    </headers>` : '<headers/>'}
                    ${buildBodySection(fail, '                    ')}
                </fail>
            </response>
        </operation>`
        })
        .join('\n')

    return `<invoker type="RESTful">
    <name>${escapeXml(String(data.name ?? ''))}</name>
    <description>${escapeXml(String(data.description ?? ''))}</description>
    <hint>${escapeXml(String(data.hint ?? ''))}</hint>
    <icon/>
    <requiredData>
${requiredDataXml}
    </requiredData>
    <authType>${escapeXml(String(data.authType ?? ''))}</authType>
    <operations>
${operationsXml}
    </operations>
</invoker>`
}
