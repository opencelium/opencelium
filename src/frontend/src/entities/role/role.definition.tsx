import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import roleWizardImage from '@assets/images/wizard/role.gif'
import {createEntityCommands} from "@/engine/entity/command/createEntityCommands.tsx";
import en from "@entities/role/i18n/en.json";
import de from "@entities/role/i18n/de.json";
import {resolveRoleNames} from "@entities/role/command/resolvers/resolveRoleNames.ts";
import type {Component, Role, RoleUpdateDTO} from "@entities/role/model/types.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {resolveRoleIds} from "@entities/role/command/resolvers/resolveRoleId.ts";
import {findRoleIdByName} from "@entities/role/command/roleCache.ts";
import {ROLE_TAG} from "@entities/role/api/role.tags.ts";
import {roleApi} from "@entities/role/api/roleApi.ts";
import {selectAuthUser} from "@entities/auth/model/authSelectors.ts";

const baseKey = 'role';

const resolveRoleId = (value: string): string => {
    if (/^\d+$/.test(value)) return value
    return String(findRoleIdByName(value) ?? value)
}

const buildRoleFetchUrl = (value: string): string =>
    `/role/${encodeURIComponent(resolveRoleId(value))}`

const buildRolePageUrl = (value: string): string =>
    `/${baseKey}/update/${encodeURIComponent(resolveRoleId(value))}`

const buildRoleViewPageUrl = (value: string): string =>
    `/${baseKey}/view/${encodeURIComponent(resolveRoleId(value))}`

export const roleDefinition: EntityDefinition = {
    name: baseKey,
    permissionComponent: 'USERGROUP',
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
            {
                type: 'delete',
                disabledReason: (row) => {
                    const currentUser = selectAuthUser(store.getState());
                    if (!currentUser) return null;
                    const ownGroupId = currentUser.userGroup?.groupId;
                    if (ownGroupId == null) return null;
                    if ((row as Role).groupId !== ownGroupId) return null;
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.actions.delete.cannotDeleteOwnRole`);
                },
            },
        ],
    },
    i18n: {
        en,
        de,
    },
    api: {
        baseUrl: '/role',
        identifierField: 'name',
        primaryKey: 'groupId',
        resolveIdentifier: resolveRoleNames,
        mapToForm: (roleModel: Role): RoleUpdateDTO => {
            return {
                ...roleModel,
                components: roleModel.components.map(c => c.componentId),
                mappedComponents: roleModel.components,
            }
        },
        mapToApi: ({data: {mappedComponents, ...formData}}: {data: RoleUpdateDTO}): Role => {
            return {
                ...formData,
                components: mappedComponents,
            }
        }
    },

    /* ===============================
       FIELDS
    ============================== */

    fields: [
        // Group Details
        {
            name: 'name',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.name.label`
                }
            },
            validation: {
                required: true,
                max: 255,
                remote: {
                    url: `/role/exists/:name`,
                    method: 'GET',
                    // Map helps to bind the current field value to the request body
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
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            },
        },
        {
            name: 'description',
            type: 'string',
            ui: {
                component: 'textarea',
                props: {
                    labelKey: `${baseKey}.fields.description.label`
                }
            },
            validation: {
                max: 5000,
            },
            table: {
                visible: true,
                order: 2,
                searchable: true,
                labelKey: `${baseKey}.fields.description.label`,
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            },
        },

        {
            name: 'groupIcon',
            type: 'other',
            ui: {
                component: 'file-dropzone',
                props: {
                    multiple: true,
                    accept: "image/png, image/jpeg",
                    labelKey: `${baseKey}.fields.groupIcon.label`,
                }
            },
        },

        //Components
        {
            name: 'components',
            type: 'array',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.components.label`,
                    asyncOptions: {
                        url: '/component/all',
                        map: (data: Component[]) => data.map(item => ({
                            value: item.componentId,
                            label: item.name
                        }))
                    },
                    multiple: true,
                }
            },
            validation: {
                required: true,
            },
            table: {
                visible: true,
                order: 3,
                searchable: true,
                labelKey: `${baseKey}.fields.components.label`,
                mapToValue: (_row, raw) => {
                    if (!Array.isArray(raw)) return '';
                    return raw
                        .map((c) => (c && typeof c === 'object' && 'name' in c ? String((c as { name?: unknown }).name ?? '') : ''))
                        .filter(Boolean)
                        .join(', ');
                },
            },
        },
        {
            name: 'mappedComponents',
            label: `${baseKey}.fields.permissions.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'permissionEditor',
            },
            validation: {
                custom: [
                    {
                        validate: (value) =>
                            Array.isArray(value) &&
                            value.every(item => item.permissions?.length > 0),

                        message: `${baseKey}.fields.permissions.errors.required`,
                    }
                ]
            }
        },
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'group-details',
            fields: [
                'name',
                'description',
            ]
        },{
            id: 'permissions',
            fields: ['components', 'mappedComponents']
        }
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: roleWizardImage as string,

        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: RoleUpdateDTO) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { name: formData.name });
                },
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: RoleUpdateDTO) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.wizard.modes.update.successMessage`, { name: formData.name });
                },
            },
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.header`,
            }
        },

        recommendations: [
            {
                title: `${baseKey}.wizard.recommendations.1`,
                link: '/connector/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/workflow/create'
            },
        ],

        steps: [
            {
                id: 'group-details',
                header: `${baseKey}.wizard.steps.group-details.header`,
                subheader: `${baseKey}.wizard.steps.group-details.subheader`,
                sectionIds: ['group-details'],
                validateFields: ['name', 'description'],
            },{
                id: 'permissions',
                header: `${baseKey}.wizard.steps.permissions.header`,
                subheader: `${baseKey}.wizard.steps.permissions.subheader`,
                sectionIds: ['permissions'],
                validateFields: ['components', 'mappedComponents']
            },
        ]
    },
    commands: (def) => (
        [
            ...createEntityCommands({def, config: {}, dsl: {
                    update: {
                        by: [
                            {
                                field: 'name',
                                resolve: resolveRoleNames,
                                buildFetchUrl: (_def, value) => buildRoleFetchUrl(value),
                                buildNavigationUrl: (_def, value) => buildRolePageUrl(value),
                            },
                            {
                                field: 'id',
                                resolve: resolveRoleIds,
                                customPath: true,
                                buildFetchUrl: (_def, value) => buildRoleFetchUrl(value),
                                buildNavigationUrl: (_def, value) => buildRolePageUrl(value),
                            }
                        ]
                    },
                    delete: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveRoleIds,
                                customPath: true,
                                buildDeleteUrl: (_def, value) => buildRoleFetchUrl(value),
                                afterDelete: async () => {
                                    await store.dispatch(
                                        roleApi.util.invalidateTags([
                                            { type: ROLE_TAG, id: 'LIST' }
                                        ])
                                    );
                                },
                                confirmMessage: (id) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byId`, {id});
                                }
                            },
                            {
                                field: 'name',
                                resolve: resolveRoleNames,
                                buildDeleteUrl: (_def, value) => buildRoleFetchUrl(value),
                                confirmMessage: (name) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byName`, {name});
                                }
                            }
                        ]
                    },
                    view: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveRoleIds,
                                customPath: true,
                                buildFetchUrl: (_def, value) => buildRoleFetchUrl(value),
                                buildNavigationUrl: (_def, value) => buildRoleViewPageUrl(value),
                            },
                            {
                                field: 'name',
                                resolve: resolveRoleNames,
                                buildFetchUrl: (_def, value) => buildRoleFetchUrl(value),
                                buildNavigationUrl: (_def, value) => buildRoleViewPageUrl(value),
                            }
                        ]
                    }
                }})
        ]
    )
}
