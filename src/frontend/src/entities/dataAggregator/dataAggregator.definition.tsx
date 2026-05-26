import { Link } from 'react-router-dom'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import aggregatorWizardImage from '@assets/images/wizard/aggregator-wizard.gif'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import en from '@entities/dataAggregator/i18n/en.json'
import de from '@entities/dataAggregator/i18n/de.json'
import { resolveDataAggregatorNames } from '@entities/dataAggregator/command/resolvers/resolveDataAggregatorNames'
import { resolveDataAggregatorIds } from '@entities/dataAggregator/command/resolvers/resolveDataAggregatorIds'
import type { DataAggregator, DataAggregatorArg, DataAggregatorDto } from '@entities/dataAggregator/model/types'
import { buildFullScript, extractSection2Content } from '@entities/dataAggregator/lib/scriptUtils'
import { ActiveSwitchCell } from '@entities/dataAggregator/ui/ActiveSwitchCell'

const baseKey = 'data-aggregator'

export const dataAggregatorDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'data-aggregators',

    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'edit' },
        { type: 'list' },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        subtitleComponents: {
            ntLink: <Link to="/notification-template" />,
        },
        defaultSort: { field: 'name', direction: 'asc' },
        bulkDelete: true,
        actions: [
            { type: 'view' },
            { type: 'update' },
        ],
        filters: [
            {
                key: 'showArchived',
                type: 'switch',
                labelKey: `${baseKey}.list.filters.showArchived`,
                defaultValue: false,
                apply: (row, value) => {
                    if (value) return true
                    return (row as DataAggregator).active !== false
                },
            },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/aggregator',
        identifierField: 'name',
        primaryKey: 'id',
        resolveIdentifier: resolveDataAggregatorNames,

        mapToForm: (model: DataAggregator) => ({
            ...model,
            script: extractSection2Content(model.script ?? ''),
        }),

        mapToApi: ({ mode, data }) => {
            const args = ((data.args ?? []) as DataAggregator['args']).map((arg: any) => ({
                ...(mode === 'update' && arg.id ? { id: arg.id } : {}),
                name: arg.name,
                description: arg.description,
            }))

            const fullScript = buildFullScript(args, (data.script ?? '') as string)

            const dto: DataAggregatorDto = {
                ...(mode === 'update' && (data as any).id ? { id: (data as any).id } : {}),
                name: data.name as string,
                active: (data as any).active ?? true,
                args,
                script: fullScript,
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
                remote: {
                    url: `/aggregator/unique/:name`,
                    method: 'GET',
                    map: (fieldValue) => ({ name: fieldValue }),
                    transKey: `${baseKey}.fields.name.errors.name_already_exists`,
                    encodeParams: false,
                    handleResponse: (data, error) => {
                        return data.result;
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
            name: 'args',
            label: `${baseKey}.fields.args.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'dataAggregatorArgsEditor',
            },
            validation: {
                required: true,
                custom: [
                    {
                        validate: (value: { name: string }[]) => {
                            if (!Array.isArray(value)) return true
                            const JS_IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
                            return value.every((arg) => arg?.name && JS_IDENT_RE.test(arg.name))
                        },
                        message: `${baseKey}.validation.argNameInvalid`,
                    },
                ],
            },
            table: {
                visible: true,
                order: 2,
                labelKey: `${baseKey}.fields.args.label`,
                mapToValue: (_row, raw) => {
                    if (!Array.isArray(raw)) return ''
                    return (raw as DataAggregatorArg[])
                        .map((arg) => arg?.name ?? '')
                        .filter(Boolean)
                        .join(', ')
                },
            },
        },
        {
            name: 'active',
            type: 'boolean',
            ui: { component: 'switch' },
            table: {
                visible: true,
                order: 3,
                align: 'center',
                labelKey: `${baseKey}.fields.archived.label`,
                render: (row, _value) => {
                    const r = row as DataAggregator
                    return <ActiveSwitchCell id={r.id} active={!!r.active} />
                },
            },
        },
        {
            name: 'script',
            label: `${baseKey}.fields.script.label`,
            type: 'string',
            ui: {
                component: 'input',
                overrideKey: 'dataAggregatorScriptEditor',
            },
            validation: {
                required: true,
                max: 65535,
                custom: [
                    {
                        validate: (value: string) => !String(value ?? '').includes('OC_ARG_NOT_EXIST'),
                        message: `${baseKey}.validation.scriptContainsNotExistedArgs`,
                    },
                ],
            },
        },
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'general-data',
            fields: ['name', 'args'],
        },
        {
            id: 'code',
            fields: ['script'],
        },
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: aggregatorWizardImage as string,
        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: DataAggregator) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { name: formData.name })
                },
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: DataAggregator) => {
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
                link: '/data-aggregator/create',
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/notification-template/create',
            },
        ],

        steps: [
            {
                id: 'general-data',
                header: `${baseKey}.wizard.steps.general-data.header`,
                subheader: `${baseKey}.wizard.steps.general-data.subheader`,
                sectionIds: ['general-data'],
                validateFields: ['name', 'args'],
            },
            {
                id: 'code',
                header: `${baseKey}.wizard.steps.code.header`,
                subheader: `${baseKey}.wizard.steps.code.subheader`,
                sectionIds: ['code'],
                validateFields: ['script'],
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
                        { field: 'name', resolve: resolveDataAggregatorNames },
                        { field: 'id', resolve: resolveDataAggregatorIds, customPath: true },
                    ],
                },
                delete: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveDataAggregatorNames,
                            confirmMessage: (name) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byName`, { name })
                            },
                        },
                        {
                            field: 'id',
                            resolve: resolveDataAggregatorIds,
                            customPath: true,
                            confirmMessage: (id) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byId`, { id })
                            },
                        },
                    ],
                },
                view: {
                    by: [
                        { field: 'name', resolve: resolveDataAggregatorNames },
                        { field: 'id', resolve: resolveDataAggregatorIds, customPath: true },
                    ],
                },
            },
        }),
    ]),
}
