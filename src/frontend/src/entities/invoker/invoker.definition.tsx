import { message } from 'antd'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import type { CommandNode } from '@shared/command/types'
import invokerWizardImage from '@assets/images/wizard/invoker-wizard.gif'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import en from '@entities/invoker/i18n/en.json'
import de from '@entities/invoker/i18n/de.json'
import { resolveInvokerNames } from '@entities/invoker/command/resolvers/resolveInvokerNames'
import type { Invoker } from '@entities/invoker/model/types'
import { InvokerUploadButton } from '@entities/invoker/components/InvokerUploadButton'
import { pickInvokerFile, uploadInvoker } from '@entities/invoker/lib/uploadInvoker'

const baseKey = 'invoker'

/* ===============================
   XML BUILDER
================================ */

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

function buildInvokerXml(data: Record<string, unknown>): string {
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

/* ===============================
   mapToForm  (Invoker → form)
================================ */

function mapInvokerToForm(model: Invoker) {
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

/* ===============================
   DEFINITION
================================ */

export const invokerDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'invokers',

    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'list' },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'name', direction: 'asc' },
        bulkDelete: true,
        actions: [
            { type: 'view' },
            { type: 'delete' },
        ],
        headerActions: [
            { key: 'upload', render: () => <InvokerUploadButton /> },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/invoker',
        identifierField: 'name',
        primaryKey: 'name',
        resolveIdentifier: resolveInvokerNames,

        mapToForm: (model: Invoker) => mapInvokerToForm(model),

        mapToApi: ({ data }) => ({
            name: data.name,
            xml: buildInvokerXml(data as Record<string, unknown>),
        }),
    },

    /* ===============================
       FIELDS
    ================================ */

    fields: [
        {
            name: 'name',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.name.label`,
                },
            },
            validation: {
                required: true,
                max: 255,
                remote: {
                    url: `/invoker/exists/:name`,
                    method: 'GET',
                    map: (fieldValue) => ({ name: fieldValue }),
                    transKey: `${baseKey}.fields.name.errors.name_already_exists`,
                    encodeParams: false,
                    handleResponse: (data, error) => {
                        return !data.result;
                    }
                }
            },
            table: {
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.name.label`,
            },
        },
        {
            name: 'description',
            type: 'string',
            ui: {
                component: 'textarea',
                props: {
                    labelKey: `${baseKey}.fields.description.label`,
                },
            },
            validation: { max: 5000 },
            table: {
                visible: true,
                order: 2,
                labelKey: `${baseKey}.fields.description.label`,
            },
        },
        {
            name: 'hint',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.hint.label`,
                },
            },
            validation: { max: 1000 },
        },
        {
            name: 'authType',
            type: 'string',
            ui: {
                component: 'select',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.authType.label`,
                    options: [
                        { value: 'apikey', label: 'API Key' },
                        { value: 'basic', label: 'Basic' },
                        { value: 'endpointAuth', label: 'Endpoint Auth' },
                        { value: 'token', label: 'Token' },
                    ],
                },
            },
            validation: { required: true },
            table: {
                visible: true,
                order: 3,
                labelKey: `${baseKey}.fields.authType.label`,
            },
        },
        {
            name: 'requiredData',
            label: `${baseKey}.fields.requiredData.label`,
            type: 'other',
            defaultValue: [],
            ui: {
                component: 'input',
                overrideKey: 'invokerRequiredDataEditor',
            },
            validation: {
                required: true,
                custom: [
                    {
                        validate: (value: unknown[]) => Array.isArray(value) && value.length > 0,
                        message: `${baseKey}.fields.requiredData.errors.required`,
                    },
                ],
            },
        },
        {
            name: 'operations',
            label: `${baseKey}.fields.operations.label`,
            type: 'other',
            defaultValue: [],
            ui: {
                component: 'input',
                overrideKey: 'invokerOperationsEditor',
            },
            validation: {
                required: true,
                custom: [
                    {
                        validate: (value: unknown[]) => Array.isArray(value) && value.length > 0,
                        message: `${baseKey}.fields.operations.errors.required`,
                    },
                    {
                        validate: (value: unknown[]) =>
                            !Array.isArray(value) ||
                            value.every(
                                (op: any) =>
                                    typeof op?.name === 'string' && op.name.trim().length > 0 &&
                                    typeof op?.endpoint === 'string' && op.endpoint.trim().length > 0
                            ),
                        message: `${baseKey}.fields.operations.errors.incompleteOperations`,
                    },
                    {
                        validate: (value: unknown[]) =>
                            !Array.isArray(value) ||
                            value.some((op: any) => op?.testConnection === true),
                        message: `${baseKey}.fields.operations.errors.noTestOperation`,
                    },
                ],
            },
            table: {
                visible: true,
                order: 4,
                labelKey: `${baseKey}.fields.operations.label`,
                mapToValue: (_row, raw) => {
                    if (!Array.isArray(raw)) return '';
                    return raw
                        .map((op) => (op && typeof op === 'object' && 'name' in op ? String((op as { name?: unknown }).name ?? '') : ''))
                        .filter(Boolean)
                        .join(', ');
                },
            },
        },
    ],

    /* ===============================
       SECTIONS
    ================================ */

    sections: [
        {
            id: 'general-data',
            fields: ['name', 'description', 'hint'],
        },
        {
            id: 'authentication',
            fields: ['authType', 'requiredData'],
        },
        {
            id: 'operations',
            fields: ['operations'],
        },
    ],

    /* ===============================
       WIZARD
    ================================ */

    wizard: {
        image: invokerWizardImage as string,
        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: Invoker) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.wizard.modes.create.successMessage`, {name: formData.name});
                }
            },
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.subheader`,
            },
        },

        recommendations: [
            {
                title: `${baseKey}.wizard.recommendations.1`,
                link: '/invoker/create',
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/connector/create',
            },
        ],

        steps: [
            {
                id: 'general-data',
                header: `${baseKey}.wizard.steps.general-data.header`,
                subheader: `${baseKey}.wizard.steps.general-data.subheader`,
                sectionIds: ['general-data'],
                validateFields: ['name'],
            },
            {
                id: 'authentication',
                header: `${baseKey}.wizard.steps.authentication.header`,
                subheader: `${baseKey}.wizard.steps.authentication.subheader`,
                sectionIds: ['authentication'],
                validateFields: ['authType', 'requiredData'],
            },
            {
                id: 'operations',
                header: `${baseKey}.wizard.steps.operations.header`,
                subheader: `${baseKey}.wizard.steps.operations.subheader`,
                sectionIds: ['operations'],
                validateFields: ['operations'],
            },
        ],
    },

    /* ===============================
       COMMANDS
    ================================ */

    commands: (def) => ([
        ...createEntityCommands({
            def,
            config: { include: ['create', 'delete', 'view'] },
            dsl: {
                delete: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveInvokerNames,
                            confirmMessage: (name) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byName`, { name })
                            },
                        },
                    ],
                },
                view: {
                    by: [
                        { field: 'name', resolve: resolveInvokerNames, customPath: true },
                    ],
                },
            },
        }),
        {
            type: 'literal',
            value: 'upload',
            group: 'create',
            icon: 'upload',
            description: 'commandPalette.descriptions.uploadInvoker',
            children: [
                {
                    type: 'literal',
                    value: 'invoker',
                    aliases: ['invokers'],
                    icon: 'upload',
                    description: 'commandPalette.descriptions.uploadInvoker',
                    execute: async (_, ctx) => {
                        const tEntities = i18n.getFixedT(i18n.language, 'entities')
                        const file = await pickInvokerFile()
                        if (!file) return

                        ctx.setLoading(true)
                        try {
                            const uploaded = await uploadInvoker(file, () =>
                                ctx.confirm({
                                    title: tEntities('invoker.list.upload.confirmReplace.title'),
                                    message: tEntities('invoker.list.upload.confirmReplace.message'),
                                }),
                            )
                            if (uploaded) {
                                message.success(
                                    tEntities('invoker.list.upload.success', { name: file.name }),
                                )
                            }
                        } catch (err) {
                            console.error(err)
                            message.error(tEntities('invoker.list.upload.error'))
                        } finally {
                            ctx.setLoading(false)
                        }
                    },
                },
            ],
        },
    ]),
}
