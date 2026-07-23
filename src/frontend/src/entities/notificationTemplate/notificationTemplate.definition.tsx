import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import notificationWizardImage from '@assets/images/wizard/notification-template-wizard.gif'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import en from '@entities/notificationTemplate/i18n/en.json'
import de from '@entities/notificationTemplate/i18n/de.json'
import { resolveNotificationTemplateNames } from '@entities/notificationTemplate/command/resolvers/resolveNotificationTemplateNames'
import { resolveNotificationTemplateIds } from '@entities/notificationTemplate/command/resolvers/resolveNotificationTemplateIds'
import { findNotificationTemplateIdByName } from '@entities/notificationTemplate/command/notificationTemplateCache'
import type { NotificationTemplate, NotificationTemplateDto } from '@entities/notificationTemplate/model/types'
import { toDisplayFormat, toServerFormat, replaceInactiveArgs } from '@entities/notificationTemplate/lib/templateArgUtils'
import { getAggregatorsFromCache } from '@entities/notificationTemplate/lib/getAggregatorsFromCache'

const baseKey = 'notification-template'

const resolveNotificationTemplateId = (value: string): string => {
    if (/^\d+$/.test(value)) return value
    return String(findNotificationTemplateIdByName(value) ?? value)
}

const buildNotificationTemplateFetchUrl = (value: string): string =>
    `/message/${encodeURIComponent(resolveNotificationTemplateId(value))}`

const buildNotificationTemplatePageUrl = (value: string): string =>
    `/${baseKey}/update/${encodeURIComponent(resolveNotificationTemplateId(value))}`

const buildNotificationTemplateViewPageUrl = (value: string): string =>
    `/${baseKey}/view/${encodeURIComponent(resolveNotificationTemplateId(value))}`

export const notificationTemplateDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'notification-templates',

    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'edit' },
        { type: 'list' },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'name', direction: 'asc' },
        bulkDelete: true,
        actions: [
            { type: 'view' },
            { type: 'update' },
            { type: 'delete' },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/message',
        identifierField: 'name',
        primaryKey: 'templateId',
        resolveIdentifier: resolveNotificationTemplateNames,

        mapToForm: (model: NotificationTemplate) => {
            const aggregators = getAggregatorsFromCache()
            const rawSubject = model.content?.[0]?.subject ?? ''
            const rawBody = model.content?.[0]?.body ?? ''
            return {
                ...model,
                aggregator: null,
                subject: toDisplayFormat(rawSubject, aggregators),
                body: toDisplayFormat(rawBody, aggregators),
            }
        },

        mapToApi: ({ mode, data }) => {
            const aggregators = getAggregatorsFromCache()
            const displaySubject = (data.subject ?? '') as string
            const displayBody = (data.body ?? '') as string

            const serverSubject = replaceInactiveArgs(
                toServerFormat(displaySubject, aggregators),
                aggregators,
            )
            const serverBody = replaceInactiveArgs(
                toServerFormat(displayBody, aggregators),
                aggregators,
            )

            const contentId = data.content?.[0]?.contentId as number | undefined
            const dto: NotificationTemplateDto & { templateId?: number } = {
                ...(mode === 'update' && data.templateId ? { templateId: data.templateId } : {}),
                name: data.name,
                type: data.type,
                content: [{
                    ...(mode === 'update' && contentId ? { contentId } : {}),
                    subject: serverSubject,
                    body: serverBody,
                    language: 'en',
                }],
            }
            return dto
        },

        operations: {
            update: {
                method: 'POST',
                buildUrl: (baseUrl) => baseUrl,
            },
        },
    },

    /* ===============================
       FIELDS
    ============================== */

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
            name: 'type',
            type: 'string',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.type.label`,
                    asyncOptions: {
                        url: '/message/tools/all',
                        map: (data: {result: string[]}) => data.result.map((v) => ({ value: v, label: v })),
                    },
                },
            },
            validation: { required: true },
            table: {
                visible: true,
                order: 2,
                searchable: true,
                labelKey: `${baseKey}.fields.type.label`,
            },
        },
        {
            name: 'subject',
            label: `${baseKey}.fields.subject.label`,
            type: 'string',
            ui: {
                component: 'input',
                overrideKey: 'templateSubjectEditor',
            },
            validation: { required: true, max: 255 },
        },
        {
            name: 'body',
            label: `${baseKey}.fields.body.label`,
            type: 'string',
            ui: {
                component: 'input',
                overrideKey: 'templateBodyEditor',
            },
            validation: { required: true, max: 65535 },
        },
        {
            name: 'aggregator',
            label: `${baseKey}.fields.aggregator.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'aggregatorWithArgsEditor',
            },
        },
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'general-data',
            fields: ['name', 'type'],
        },
        {
            id: 'template-content',
            fields: ['aggregator', 'subject', 'body'],
        },
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: notificationWizardImage as string,
        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: NotificationTemplate) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { name: formData.name })
                },
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: NotificationTemplate) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.wizard.modes.update.successMessage`, { name: formData.name })
                },
            },
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.subheader`,
            },
        },

        recommendations: [
            {
                title: `${baseKey}.wizard.recommendations.1`,
                link: '/notification-template/create',
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/schedule/create',
            },
        ],

        steps: [
            {
                id: 'general-data',
                header: `${baseKey}.wizard.steps.general-data.header`,
                subheader: `${baseKey}.wizard.steps.general-data.subheader`,
                sectionIds: ['general-data'],
                validateFields: ['name', 'type'],
            },
            {
                id: 'template-content',
                header: `${baseKey}.wizard.steps.template-content.header`,
                subheader: `${baseKey}.wizard.steps.template-content.subheader`,
                sectionIds: ['template-content'],
                validateFields: ['subject', 'body'],
            },
        ],
    },

    /* ===============================
       COMMANDS
    ============================== */

    commands: (def) => ([
        ...createEntityCommands({
            def,
            config: {},
            dsl: {
                update: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveNotificationTemplateNames,
                            buildFetchUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildNotificationTemplatePageUrl(value),
                        },
                        {
                            field: 'id',
                            resolve: resolveNotificationTemplateIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildNotificationTemplatePageUrl(value),
                        },
                    ],
                },
                delete: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveNotificationTemplateNames,
                            buildDeleteUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            confirmMessage: (name) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byName`, { name })
                            },
                        },
                        {
                            field: 'id',
                            resolve: resolveNotificationTemplateIds,
                            customPath: true,
                            buildDeleteUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            confirmMessage: (id) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byId`, { id })
                            },
                        },
                    ],
                },
                view: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveNotificationTemplateNames,
                            buildFetchUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildNotificationTemplateViewPageUrl(value),
                        },
                        {
                            field: 'id',
                            resolve: resolveNotificationTemplateIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildNotificationTemplateFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildNotificationTemplateViewPageUrl(value),
                        },
                    ],
                },
            },
        }),
    ]),
}
