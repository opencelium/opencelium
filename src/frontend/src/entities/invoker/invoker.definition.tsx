import { message } from 'antd'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import invokerWizardImage from '@assets/images/wizard/invoker-wizard.gif'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import en from '@entities/invoker/i18n/en.json'
import de from '@entities/invoker/i18n/de.json'
import { resolveInvokerNames } from '@entities/invoker/command/resolvers/resolveInvokerNames'
import {
    isInvokerNameCharacterSetValid,
    isInvokerNameDotPlacementValid,
    isInvokerNameLengthValid,
    normalizeInvokerName,
    normalizeInvokerNameForComparison,
} from '@entities/invoker/lib/invokerName'
import type { Invoker } from '@entities/invoker/model/types'
import { InvokerUploadButton } from '@entities/invoker/components/InvokerUploadButton'
import { pickInvokerFile, uploadInvoker } from '@entities/invoker/lib/uploadInvoker'
import { buildInvokerXml } from '@entities/invoker/lib/invokerXml'
import { mapInvokerToForm } from '@entities/invoker/lib/mapInvokerToForm'
import { downloadInvoker } from '@entities/invoker/lib/downloadInvoker'
import { buildActionAccess } from '@/engine/policy'
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'
import { notifyError } from '@shared/ui/feedback/notifyError'

const baseKey = 'invoker'

/* ===============================
   DEFINITION
================================ */

export const invokerDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'invokers',
    permissionComponent: 'INVOKER',

    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'list' },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'name', direction: 'asc' },
        bulkDelete: {
            confirmMessage: (ids) => {
                const t = i18n.getFixedT(i18n.language, 'entities');
                return t(`${baseKey}.confirmation.delete.bulkMessage`, { count: ids.length });
            },
        },
        actions: [
            { type: 'view' },
            {
                type: 'delete',
                confirmMessage: (value, _entity, row) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    const name = (row as Invoker)?.name ?? value;
                    return t(`${baseKey}.confirmation.delete.byName`, { name });
                },
            },
        ],
        headerActions: [
            { key: 'upload', permissionAction: 'CREATE', render: () => <InvokerUploadButton /> },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/invoker',
        identifierField: 'name',
        primaryKey: 'name',
        resolveIdentifier: resolveInvokerNames,

        mapToForm: (model: Invoker) => mapInvokerToForm(model),

        mapToApi: ({ data }) => {
            const normalizedData = {
                ...data,
                name: normalizeInvokerName(data.name),
            }

            return {
                name: normalizedData.name,
                xml: buildInvokerXml(normalizedData as Record<string, unknown>),
            }
        },
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
                custom: [
                    {
                        validate: isInvokerNameCharacterSetValid,
                        message: `${baseKey}.fields.name.errors.invalid_characters`,
                    },
                    {
                        validate: isInvokerNameDotPlacementValid,
                        message: `${baseKey}.fields.name.errors.invalid_period`,
                    },
                    {
                        validate: isInvokerNameLengthValid,
                        message: `${baseKey}.fields.name.errors.max_length`,
                    },
                ],
                remote: {
                    url: `/invoker/exists/:name`,
                    method: 'GET',
                    map: (fieldValue) => ({
                        name: normalizeInvokerNameForComparison(fieldValue),
                    }),
                    transKey: `${baseKey}.fields.name.errors.name_already_exists`,
                    encodeParams: false,
                    handleResponse: (data, error) => {
                        return !data.result;
                    }
                }
            },
            table: {
                width: '25%',
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.name.label`,
                render: (_row, value) => <TruncatedTextCell value={value} />,
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
                width: '45%',
                visible: true,
                order: 2,
                labelKey: `${baseKey}.fields.description.label`,
                render: (_row, value) => <TruncatedTextCell value={value} />,
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
                render: (_row, value) => <TruncatedTextCell value={value} />,
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
                render: (_row, value) => <TruncatedTextCell value={value} />,
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
            config: { include: ['create', 'delete', 'list', 'view'] },
            dsl: {
                delete: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveInvokerNames,
                            customPath: true,
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
                    icon: 'upload',
                    description: 'commandPalette.descriptions.uploadInvoker',
                    // The outer "upload" literal is shared/merged with other entities'
                    // upload commands (e.g. connectionTemplate) — access must live here.
                    access: buildActionAccess('INVOKER', 'CREATE'),
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
                                ctx.setInputValue('')
                            }
                        } catch (err) {
                            console.error(err)
                            notifyError(tEntities('invoker.list.upload.error'))
                        } finally {
                            ctx.setLoading(false)
                        }
                    },
                },
            ],
        },
        {
            type: 'literal',
            value: 'download',
            aliases: ['export'],
            group: 'manage',
            icon: 'download',
            description: 'commandPalette.descriptions.downloadInvoker',
            children: [
                {
                    type: 'literal',
                    value: 'invoker',
                    icon: 'download',
                    description: 'commandPalette.descriptions.downloadInvoker',
                    children: [
                        {
                            type: 'literal',
                            value: 'by',
                            children: [
                                {
                                    type: 'literal',
                                    value: 'name',
                                    children: [
                                        {
                                            type: 'entity',
                                            name: 'identifier',
                                            resolve: resolveInvokerNames,
                                            execute: async (args, ctx) => {
                                                const tEntities = i18n.getFixedT(i18n.language, 'entities')
                                                const name = args.identifier as string
                                                ctx.setLoading(true)
                                                try {
                                                    const downloaded = await downloadInvoker(name)
                                                    message.success(
                                                        tEntities('invoker.list.download.success', { name: downloaded }),
                                                    )
                                                } catch (err) {
                                                    console.error(err)
                                                    notifyError(tEntities('invoker.list.download.error'))
                                                } finally {
                                                    ctx.setLoading(false)
                                                }
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ]),
}
