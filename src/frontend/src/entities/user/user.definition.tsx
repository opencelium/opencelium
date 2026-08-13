import type { EntityDefinition } from '@/engine/entity/EntityDefinition.ts'
import userWizardImage from '@assets/images/wizard/user-wizard.gif'
import {createEntityCommands} from "@/engine/entity/command/createEntityCommands.tsx";
import {resolveUserEmails} from "@entities/user/command/resolvers/resolveUserEmails.ts";
import {store} from "@app/store/store.ts";
import {resolveUserIds} from "@entities/user/command/resolvers/resolveUserId.ts";
import {findUserIdByEmail} from "@entities/user/command/userCache.ts";
import {userApi} from "@entities/user/api/userApi.ts";
import type {User, UserUpdateDto} from "@entities/user/model/types.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import en from './i18n/en.json';
import de from './i18n/de.json';
import {USER_TAG} from "@entities/user/api/user.tags.ts";
import {TotpToggle} from "@entities/user/ui/TotpToggle.tsx";
import {apiExecutor} from "@shared/api/apiExecutor.ts";
import {message} from "antd";
import {selectAuthUser} from "@entities/auth/model/authSelectors.ts";
const baseKey = 'user';

const resolveUserId = (value: string): string => {
    if (/^\d+$/.test(value)) return value
    return String(findUserIdByEmail(value) ?? value)
}

const buildUserFetchUrl = (value: string): string =>
    `/user/${encodeURIComponent(resolveUserId(value))}`

const buildUserPageUrl = (value: string): string =>
    `/user/update/${encodeURIComponent(resolveUserId(value))}`

const buildUserViewPageUrl = (value: string): string =>
    `/user/view/${encodeURIComponent(resolveUserId(value))}`

export const userDefinition: EntityDefinition = {
    name: baseKey,
    permissionComponent: 'USER',
    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'edit' },
        { type: 'list' },
    ],
    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'email', direction: 'asc' },
        bulkDelete: true,
        actions: [
            { type: 'view' },
            { type: 'update' },
            {
                type: 'delete',
                confirmMessage: (_value, _entity, row) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.list.confirmDelete.message`, { email: (row as User).email });
                },
                disabledReason: (row) => {
                    const currentUser = selectAuthUser(store.getState());
                    if (!currentUser) return null;
                    if ((row as User).userId !== currentUser.userId) return null;
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.actions.delete.cannotDeleteSelf`);
                },
            },
        ],
        bulkActions: [
            {
                buttonType: 'primary',
                key: 'enableTotp',
                labelKey: `${baseKey}.totp.bulkEnable.label`,
                field: 'userId',
                permissionAction: 'UPDATE',
                run: async ({ ids, clearSelection }) => {
                    await apiExecutor({
                        url: '/user/list/totp/enable',
                        method: 'PUT',
                        body: { identifiers: ids },
                    });
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    message.success(t(`${baseKey}.totp.bulkEnable.success`, { count: ids.length }));
                    clearSelection();
                },
            },
        ],
    },
    i18n: {
        en,
        de,
    },
    crossValidations: [
        {
            fields: ['password', 'repeatPassword'],
            validate: (data) =>
                data.password === data.repeatPassword,
            message: `${baseKey}.crossValidations.repeatPassword.message`,
            path: 'repeatPassword'
        }
    ],
    api: {
        baseUrl: '/user',
        identifierField: 'email',
        primaryKey: 'userId',
        resolveIdentifier: resolveUserEmails,
        mapToForm: (userModel: User): UserUpdateDto => {
            return {
                ...userModel,
                userGroup: userModel?.userGroup?.groupId,
            }
        }
    },

    /* ===============================
       FIELDS
    ============================== */

    fields: [
        // User Detail
        {
            name: 'userDetail.name',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
/*                    info: {
                        content: `${baseKey}.fields.userDetail.name.info`,
                    },*/
                    labelKey: `${baseKey}.fields.userDetail.name.label`
                }
            },
            validation: {
                required: true,
                max: 255
            },
            table: {
                width: '25%',
                visible: true,
                order: 2,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.userDetail.name.label`,
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            }
        },
        {
            name: 'userDetail.surname',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.userDetail.surname.label`
                }
            },
            validation: {
                required: true,
                max: 255
            },
            table: {
                width: '25%',
                visible: true,
                order: 3,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.userDetail.surname.label`,
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            }
        },
        {
            name: 'userDetail.department',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.userDetail.department.label`
                }
            },
            validation: {
                max: 100
            }
        },
        {
            name: 'userDetail.organization',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.userDetail.organization.label`
                }
            },
            validation: {
                max: 100
            },/*
            access: {
                strategy: 'hide',
                rules: [
                    {
                        effect: 'allow',
                        roles: ['admin']
                    },
                    {
                        effect: 'allow',
                        resolver: 'owner'
                    }
                ]
            }*/
        },
        {
            name: 'userDetail.phoneNumber',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.userDetail.phoneNumber.label`,
                }
            },
            validation: {
                required: false,
                allowEmptyString: true,
                regex: [
                    {pattern: /^[+]?[\d\s\-()]{6,20}$/, message: `${baseKey}.fields.userDetail.phoneNumber.validation1`}
                ]
            }
        },
        //credentials
        {
            name: 'email',
            type: 'string',
            defaultValue: 'admin@opencelium.io',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.email.label`,
                }
            },
            validation: {
                required: true,
                max: 255,
                remote: {
                    url: `/user/check/:email`,
                    method: 'GET', // or GET, depending on the API
                    // Map helps to bind the current field value to the request body
                    map: (fieldValue) => ({ email: fieldValue }),
                    transKey: `${baseKey}.fields.email.errors.email_already_exists`,
                    encodeParams: false,
                    // On update, the user's own email already exists — only re-check
                    // uniqueness when the value actually changed from the loaded record.
                    skipIfUnchanged: true,
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
                labelKey: `${baseKey}.fields.email.label`,
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            },/*
            access: {
                strategy: 'disable',
                rules: [
                    {
                        effect: 'allow',
                        roles: ['admin']
                    },
                    {
                        effect: 'deny',
                        modes: ['update']
                    }
                ]
            }*/
        },
        {
            name: 'password',
            type: 'string',
            defaultValue: '1234qwerQ!',
            ui: {
                component: 'password',
                props: {
/*                    info: {
                        content: `${baseKey}.fields.password.info`,
                    },*/
                    labelKey: `${baseKey}.fields.password.label`,
                }
            },
            validation: {
                required: true,
                min: 8,
                max: 16,
                regex: [
                    { pattern: /[A-Z]/, message: `${baseKey}.fields.password.validation1` },
                    { pattern: /[a-z]/, message: `${baseKey}.fields.password.validation2` },
                    { pattern: /\d/, message: `${baseKey}.fields.password.validation3` },
                    { pattern: /[^A-Za-z0-9]/, message: `${baseKey}.fields.password.validation4` }
                ]
            },/*
            access: {
                strategy: 'forbid',
                rules: [
                    {
                        effect: 'deny',
                        roles: ['viewer']
                    }
                ]
            }*/
        },
        {
            name: 'repeatPassword',
            type: 'string',
            ui: {
                component: 'password',
                props: {
                    labelKey: `${baseKey}.fields.repeatPassword.label`,
                }
            },
            validation: {
                required: true,
            }
        },
        {
            name: 'userGroup',
            type: 'number',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.userGroup.label`,
                    asyncOptions: {
                        url: '/role/all',
                        map: (data: any[]) => data.map(item => ({
                            value: item.groupId,
                            label: item.name
                        }))
                    }
                }
            },

            validation: {
                required: true
            },
            table: {
                visible: true,
                order: 4,
                searchable: true,
                labelKey: `${baseKey}.fields.userGroup.label`,
                mapToValue: (_row, raw) => {
                    if (typeof raw === 'string') return raw;
                    if (raw && typeof raw === 'object' && 'name' in raw) {
                        return (raw as { name?: unknown }).name as string | undefined;
                    }
                    return undefined;
                },
                render: (_row, value) => (
                    <div style={{ whiteSpace: 'normal' }}>{typeof value === 'string' ? value : ''}</div>
                ),
            },
        },
        {
            name: 'totpEnabled',
            type: 'boolean',
            ui: { component: 'switch' },
            table: {
                visible: true,
                order: 5,
                width: 1,
                align: 'center',
                labelKey: `${baseKey}.fields.totpEnabled.label`,
                render: (row, value) => {
                    const user = row as User
                    return (
                        <TotpToggle
                            userId={user.userId}
                            enabled={Boolean(value)}
                        />
                    )
                },
            },
        }
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'details',
            fields: [
                'userDetail.name',
                'userDetail.surname',
                'userDetail.department',
                'userDetail.organization',
                'userDetail.phoneNumber',
            ]
        },{
            id: 'credentials',
            fields: ['email', 'password', 'repeatPassword'],/*
            access: {
                strategy: 'disable',
                rules: [
                    {
                        effect: 'allow',
                        roles: ['admin']
                    },

                    {effect: 'deny', modes: ['update']},
                ]
            }*/
        },{
            id: 'role',
            fields: ['userGroup'],/*
            access: {
                strategy: 'hide',
                rules: [
                    {
                        effect: 'allow',
                        roles: ['admin']
                    },

                ]
            }*/
        }
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: userWizardImage as string,

        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: UserUpdateDto) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    const fullName = [formData.userDetail?.name, formData.userDetail?.surname].filter(Boolean).join(' ');
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { name: fullName || formData.email });
                },
/*                info: [
                    {
                        title: 'User',
                        content: `${baseKey}.wizard.modes.create.info`,
                    }
                ]*/
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: UserUpdateDto) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    const fullName = [formData.userDetail?.name, formData.userDetail?.surname].filter(Boolean).join(' ');
                    return t(`${baseKey}.wizard.modes.update.successMessage`, { name: fullName || formData.email });
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
                link: '/role/create'
            }
        ],

        steps: [{
                id: 'details',
                header: `${baseKey}.wizard.steps.details.header`,
                subheader: `${baseKey}.wizard.steps.details.subheader`,
                sectionIds: ['details'],
                validateFields: ['userDetail.name', 'userDetail.surname', 'userDetail.phoneNumber'],
/*                info: [
                    {
                        content: `${baseKey}.wizard.steps.details.info`,
                    }
                ]*/
            },
            {
                id: 'credentials',
                header: `${baseKey}.wizard.steps.credentials.header`,
                subheader: `${baseKey}.wizard.steps.credentials.subheader`,
                sectionIds: ['credentials'],
                validateFields: ['email', 'password', 'repeatPassword']
            },
            {
                id: 'role',
                header: `${baseKey}.wizard.steps.role.header`,
                subheader: `${baseKey}.wizard.steps.role.subheader`,
                sectionIds: ['role'],
                validateFields: ['userGroup']
            }
        ]
    },
    commands: (def) => (
        [
            ...createEntityCommands({def, config: {}, dsl: {
                update: {
                    by: [
                        {
                            field: 'email',
                            resolve: resolveUserEmails,
                            buildFetchUrl: (_def, value) => buildUserFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildUserPageUrl(value),
                        },
                        {
                            field: 'id',
                            resolve: resolveUserIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildUserFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildUserPageUrl(value),
                        }
                    ]
                },
                delete: {
                    by: [
                        {
                            field: 'id',
                            resolve: resolveUserIds,
                            customPath: true,
                            buildDeleteUrl: (_def, value) => buildUserFetchUrl(value),
                            afterDelete: async () => {
                                await store.dispatch(
                                    userApi.util.invalidateTags([
                                        { type: USER_TAG, id: 'LIST' }
                                    ])
                                );
                            },
                            confirmMessage: (id) => {
                                const t = i18n.getFixedT(i18n.language, 'entities');
                                return t(`${baseKey}.confirmation.delete.byId`, {id});
                            }
                        },
                        {
                            field: 'email',
                            resolve: resolveUserEmails,
                            buildDeleteUrl: (_def, value) => buildUserFetchUrl(value),
                            confirmMessage: (email) => {
                                const t = i18n.getFixedT(i18n.language, 'entities');
                                return t(`${baseKey}.confirmation.delete.byEmail`, {email});
                            }
                        }
                    ]
                },
                view: {
                    by: [
                        {
                            field: 'id',
                            resolve: resolveUserIds,
                            customPath: true,
                            buildFetchUrl: (_def, value) => buildUserFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildUserViewPageUrl(value),
                        },
                        {
                            field: 'email',
                            resolve: resolveUserEmails,
                            buildFetchUrl: (_def, value) => buildUserFetchUrl(value),
                            buildNavigationUrl: (_def, value) => buildUserViewPageUrl(value),
                        }
                    ]
                }
            }})
        ]
    )
}
