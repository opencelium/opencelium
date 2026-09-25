import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import categoryWizardImage from '@assets/images/wizard/category-wizard.gif'
import { createEntityCommands } from '@/engine/entity/command/createEntityCommands.tsx'
import { i18n } from '@shared/i18n/config/i18n.ts'
import en from '@entities/category/i18n/en.json'
import de from '@entities/category/i18n/de.json'
import { resolveCategoryNames } from '@entities/category/command/resolvers/resolveCategoryNames'
import { resolveCategoryIds } from '@entities/category/command/resolvers/resolveCategoryIds'
import { findCategoryIdByName } from '@entities/category/command/categoryCache'
import type {Category, CategoryDto} from "@entities/category/model/types.ts";
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'

const baseKey = 'category'

const resolveCategoryId = (value: string): string => {
    if (/^\d+$/.test(value)) return value
    return String(findCategoryIdByName(value) ?? value)
}

const buildCategoryFetchUrl = (value: string): string =>
    `/category/${encodeURIComponent(resolveCategoryId(value))}`

const buildCategoryPageUrl = (value: string): string =>
    `/category/update/${encodeURIComponent(resolveCategoryId(value))}`

const buildCategoryViewPageUrl = (value: string): string =>
    `/category/view/${encodeURIComponent(resolveCategoryId(value))}`

export const categoryDefinition: EntityDefinition = {
    name: baseKey,
    plural: 'categories',

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
            {
                type: 'delete',
                confirmMessage: (_value, _entity, row) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.list.confirmDelete.message`, { name: (row as Category).name })
                },
            },
        ],
    },

    i18n: { en, de },

    api: {
        baseUrl: '/category',
        identifierField: 'name',
        primaryKey: 'id',
        resolveIdentifier: resolveCategoryNames,
        mapToForm: (categoryModel: Category): CategoryDto => {
            return {
                ...categoryModel,
                parentCategory: categoryModel?.parentCategory?.id,
            }
        }
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
                }
            },
            validation: {
                required: true,
                max: 255,
                remote: {
                    url: `/category/check/:name`,
                    method: 'GET',
                    map: (fieldValue) => ({ name: fieldValue }),
                    transKey: `${baseKey}.fields.name.errors.name_already_exists`,
                    encodeParams: false,
                    skipIfUnchanged: true,
                    handleResponse: (data, error) => {
                        return data.message === 'NOT_EXISTS';
                    }
                }
            },
            table: {
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.name.label`,
                render: (_row, value) => <TruncatedTextCell value={value} />,
            },
        },
        {
            name: 'parentCategory',
            label: `${baseKey}.fields.parentCategory.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'parentCategoryEditor',
            },
        },
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'general-data',
            fields: ['name', 'parentCategory'],
        },
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: categoryWizardImage as string,
        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: CategoryDto) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { name: formData.name })
                },
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: CategoryDto) => {
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
                link: '/category/create',
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/workflow/create',
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
                            resolve: resolveCategoryNames,
                            buildFetchUrl: (_def, value) => buildCategoryFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildCategoryPageUrl(value),
                        },
                        {
                            field: 'id',
                            resolve: resolveCategoryIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildCategoryFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildCategoryPageUrl(value),
                        },
                    ],
                },
                delete: {
                    by: [
                        {
                            field: 'name',
                            resolve: resolveCategoryNames,
                            buildDeleteUrl: (_def, value) => buildCategoryFetchUrl(value),
                            confirmMessage: (name) => {
                                const t = i18n.getFixedT(i18n.language, 'entities')
                                return t(`${baseKey}.confirmation.delete.byName`, { name })
                            },
                        },
                        {
                            field: 'id',
                            resolve: resolveCategoryIds,
                            customPath: true,
                            buildDeleteUrl: (_def, value) => buildCategoryFetchUrl(value),
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
                            resolve: resolveCategoryNames,
                            buildFetchUrl: (_def, value) => buildCategoryFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildCategoryViewPageUrl(value),
                        },
                        {
                            field: 'id',
                            resolve: resolveCategoryIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildCategoryFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildCategoryViewPageUrl(value),
                        },
                    ],
                },
            },
        }),
    ]),
}
