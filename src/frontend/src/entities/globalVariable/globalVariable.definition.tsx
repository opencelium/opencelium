import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import aggregatorWizardImage from '@assets/images/wizard/aggregator.svg'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'
import en from '@entities/globalVariable/i18n/en.json'
import de from '@entities/globalVariable/i18n/de.json'
import { GLOBAL_VARIABLE_ENTITY as baseKey, GLOBAL_VARIABLE_PATH } from './globalVariable.constants'
import {
    emptyScope,
    isCodeMissing,
    isScopeIncomplete,
    isValueMissing,
    MAX_VALUE_BYTES,
    NAME_PATTERN,
    valueByteSize,
    type GlobalVariableFormValues,
} from './model/form'
import type { GlobalVariableListItem } from './model/types'
import { emptyScript, MAX_SCRIPT_BYTES, parameterProblems, type ScriptFormValues } from './model/script'
import { resolveGlobalVariableNames } from './command/resolvers/resolveGlobalVariableNames'
import { resolveGlobalVariableIds } from './command/resolvers/resolveGlobalVariableIds'
import { resolveGlobalVariableId } from './command/globalVariableCache'
import { GlobalVariableKindBadge } from './ui/GlobalVariableKindBadge'
import { LiveValueCell } from './ui/live-values/LiveValueCell'
import { GlobalVariableDeleteAction } from './ui/delete/GlobalVariableDeleteAction'
import { GlobalVariableListPage } from './ui/pages/GlobalVariableListPage'
import { GlobalVariableCreatePage, GlobalVariableUpdatePage } from './ui/pages/GlobalVariableFormPage'
import { GlobalVariableDetailPage } from './ui/pages/GlobalVariableDetailPage'

const asRow = (row: unknown) => row as GlobalVariableListItem
const viewUrl = (value: string) => `${GLOBAL_VARIABLE_PATH}/view/${encodeURIComponent(resolveGlobalVariableId(value))}`
const updateUrl = (value: string) => `${GLOBAL_VARIABLE_PATH}/update/${encodeURIComponent(resolveGlobalVariableId(value))}`
const fetchUrl = (value: string) => `${GLOBAL_VARIABLE_PATH}/${encodeURIComponent(resolveGlobalVariableId(value))}`
const tEntities = () => i18n.getFixedT(i18n.language, 'entities')

export const globalVariableDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'global-variables',

    routes: [
        { type: 'list', element: <GlobalVariableListPage /> },
        { type: 'create', element: <GlobalVariableCreatePage /> },
        { type: 'edit', element: <GlobalVariableUpdatePage /> },
        { type: 'view', element: <GlobalVariableDetailPage /> },
    ],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        // Client-side paging until the generic list can page on the server; the contract caps nothing below 1000.
        fetchUrl: `${GLOBAL_VARIABLE_PATH}/all?page=0&size=1000&sort=name,asc`,
        defaultSort: { field: 'name', direction: 'asc' },
        actions: [
            { type: 'view', buildNavigationUrl: (_entity, value) => viewUrl(value) },
            { type: 'update', buildNavigationUrl: (_entity, value) => updateUrl(value) },
            {
                type: 'custom',
                key: 'delete',
                render: ({ row, iconSize, tooltipPlacement }) => (
                    <GlobalVariableDeleteAction row={asRow(row)} iconSize={iconSize} tooltipPlacement={tooltipPlacement} />
                ),
            },
        ],
    },

    i18n: { en, de },

    // Field validators don't see sibling values, and whether a blank value is allowed depends on `secret`.
    crossValidations: [
        {
            fields: ['secret', 'value'],
            validate: (data) => !isValueMissing(data as Partial<GlobalVariableFormValues>),
            message: `${baseKey}.fields.value.errors.required`,
            path: 'value',
        },
        {
            fields: ['script'],
            validate: (data) => !isCodeMissing(data as Partial<GlobalVariableFormValues>),
            message: `${baseKey}.script.errors.codeRequired`,
            path: 'script.code',
        },
        {
            fields: ['script'],
            validate: (data) => {
                const values = data as Partial<GlobalVariableFormValues>
                return values.kind !== 'SCRIPT' || valueByteSize(values.script?.code ?? '') <= MAX_SCRIPT_BYTES
            },
            message: `${baseKey}.script.errors.tooLarge`,
            path: 'script.code',
        },
        {
            fields: ['script'],
            validate: (data) => {
                const values = data as Partial<GlobalVariableFormValues>
                return values.kind !== 'SCRIPT' || parameterProblems(values.script?.parameters ?? []) === null
            },
            message: `${baseKey}.script.errors.parameters`,
            path: 'script.parameters',
        },
    ],

    api: {
        baseUrl: GLOBAL_VARIABLE_PATH,
        identifierField: 'name',
        primaryKey: 'id',
        resolveIdentifier: resolveGlobalVariableNames,
    },

    fields: [
        {
            name: 'kind',
            label: `${baseKey}.fields.kind.label`,
            type: 'other',
            defaultValue: 'CONSTANT',
            ui: { component: 'input', overrideKey: 'globalVariableKindPicker' },
            validation: { required: true },
            table: {
                visible: true, order: 1, width: 70, sortable: true, searchable: true, align: 'center',
                labelKey: `${baseKey}.fields.kind.label`,
                render: (row) => <GlobalVariableKindBadge kind={asRow(row).kind} isIconOnly />,
            },
        },
        {
            name: 'name',
            type: 'string',
            ui: { component: 'input', props: { autoFocus: true, labelKey: `${baseKey}.fields.name.label` } },
            validation: {
                required: true,
                max: 64,
                regex: [{ pattern: NAME_PATTERN, message: `${baseKey}.fields.name.errors.pattern` }],
                remote: {
                    url: `${GLOBAL_VARIABLE_PATH}/unique/:name`,
                    method: 'GET',
                    map: (fieldValue) => ({ name: fieldValue }),
                    transKey: `${baseKey}.fields.name.errors.taken`,
                    encodeParams: false,
                    handleResponse: (data) => data.result,
                    skipIfUnchanged: true,
                },
            },
            table: {
                visible: true, order: 2, width: '20%', sortable: true, searchable: true,
                labelKey: `${baseKey}.fields.name.label`,
                render: (_row, value) => <code>{String(value)}</code>,
            },
        },
        {
            name: 'description',
            type: 'string',
            ui: { component: 'textarea', props: { labelKey: `${baseKey}.fields.description.label` } },
            validation: { max: 512 },
            table: {
                visible: true, order: 3, width: '25%', searchable: true,
                labelKey: `${baseKey}.fields.description.label`,
                render: (_row, value) => <TruncatedTextCell value={value} />,
            },
        },
        {
            name: 'secret',
            type: 'boolean',
            defaultValue: false,
            ui: { component: 'switch', props: { labelKey: `${baseKey}.fields.secret.label` } },
        },
        {
            name: 'value',
            label: `${baseKey}.fields.value.label`,
            type: 'other',
            defaultValue: '',
            ui: { component: 'input', overrideKey: 'globalVariableContentEditor' },
            validation: {
                custom: [
                    {
                        validate: (value: unknown) => valueByteSize(String(value ?? '')) <= MAX_VALUE_BYTES,
                        message: `${baseKey}.fields.value.errors.tooLarge`,
                    },
                ],
            },
        },
        {
            name: 'script',
            type: 'other',
            defaultValue: emptyScript() satisfies ScriptFormValues,
            ui: { component: 'input' },
        },
        {
            name: 'valuePreview',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true, order: 4, width: '25%',
                labelKey: `${baseKey}.fields.value.label`,
                render: (row) => <LiveValueCell row={asRow(row)} />,
            },
        },
        {
            name: 'scope',
            label: `${baseKey}.fields.scope.label`,
            type: 'other',
            defaultValue: emptyScope(),
            ui: { component: 'input', overrideKey: 'globalVariableScopeEditor' },
            validation: {
                custom: [{ validate: (value) => !isScopeIncomplete(value), message: `${baseKey}.fields.scope.errors.noTarget` }],
            },
        },
        {
            name: 'scopeType',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true, order: 5, sortable: true,
                labelKey: `${baseKey}.fields.scope.label`,
                mapToValue: (_row, raw) => tEntities()(`${baseKey}.scope.${String(raw)}`),
            },
        },
        {
            name: 'usageCount',
            type: 'number',
            ui: { component: 'input' },
            table: { visible: true, order: 6, sortable: true, align: 'center', labelKey: `${baseKey}.list.columns.usageCount` },
        },
        {
            name: 'updatedAt',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true, order: 7, sortable: true,
                labelKey: `${baseKey}.list.columns.updated`,
                render: (row) => {
                    const { updatedAt, updatedBy } = asRow(row)
                    return (
                        <TruncatedTextCell
                            value={tEntities()(`${baseKey}.detail.updatedBy`, {
                                time: new Date(updatedAt).toLocaleString(i18n.language),
                                name: updatedBy.name,
                            })}
                        />
                    )
                },
            },
        },
    ],

    sections: [
        { id: 'general', fields: ['kind', 'name', 'description'] },
        { id: 'value', fields: ['value'] },
        { id: 'visibility', fields: ['scope'] },
    ],

    wizard: {
        image: aggregatorWizardImage as string,
        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                getSuccessMessage: (formData: GlobalVariableFormValues) =>
                    tEntities()(`${baseKey}.wizard.modes.create.successMessage`, { name: formData.name }),
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                getSuccessMessage: (formData: GlobalVariableFormValues) =>
                    tEntities()(`${baseKey}.wizard.modes.update.successMessage`, { name: formData.name }),
            },
        },
        recommendations: [
            { title: `${baseKey}.wizard.recommendations.list`, link: GLOBAL_VARIABLE_PATH },
            { title: `${baseKey}.wizard.recommendations.create`, link: `${GLOBAL_VARIABLE_PATH}/create` },
        ],
        steps: [
            {
                id: 'general',
                header: `${baseKey}.wizard.steps.general.header`,
                subheader: `${baseKey}.wizard.steps.general.subheader`,
                sectionIds: ['general'],
                validateFields: ['kind', 'name', 'description'],
            },
            {
                id: 'value',
                header: `${baseKey}.wizard.steps.value.header`,
                subheader: `${baseKey}.wizard.steps.value.subheader`,
                sectionIds: ['value'],
                validateFields: ['secret', 'value', 'script'],
            },
            {
                id: 'visibility',
                header: `${baseKey}.wizard.steps.visibility.header`,
                subheader: `${baseKey}.wizard.steps.visibility.subheader`,
                sectionIds: ['visibility'],
                validateFields: ['scope'],
            },
        ],
    },

    commands: (def) => createEntityCommands({
        def,
        config: { exclude: ['delete'] },
        dsl: {
            update: {
                by: [
                    { field: 'name', resolve: resolveGlobalVariableNames, buildFetchUrl: (_def, value) => fetchUrl(value), buildNavigationUrl: (_def, value) => updateUrl(value) },
                    { field: 'id', resolve: resolveGlobalVariableIds, buildFetchUrl: (_def, value) => fetchUrl(value), buildNavigationUrl: (_def, value) => updateUrl(value) },
                ],
            },
            view: {
                by: [
                    { field: 'name', resolve: resolveGlobalVariableNames, buildFetchUrl: (_def, value) => fetchUrl(value), buildNavigationUrl: (_def, value) => viewUrl(value) },
                    { field: 'id', resolve: resolveGlobalVariableIds, customPath: true, buildFetchUrl: (_def, value) => fetchUrl(value), buildNavigationUrl: (_def, value) => viewUrl(value) },
                ],
            },
        },
    }),
}
