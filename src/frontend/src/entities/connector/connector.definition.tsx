import type {EntityDefinition, Mode} from '@/engine/entity/EntityDefinition'
import connectorWizardImage from '@/assets/images/wizard/connector.gif'
import {createEntityCommands} from "@/engine/entity/command/createEntityCommands.tsx";
import en from "@entities/connector/i18n/en.json";
import de from "@entities/connector/i18n/de.json";
import {resolveConnectorTitles} from "@entities/connector/command/resolvers/resolveConnectorTitles.ts";
import type {Connector, ConnectorUpdateDto} from "@entities/connector/model/types.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {resolveConnectorIds} from "@entities/connector/command/resolvers/resolveConnectorId.ts";
import {CONNECTOR_TAG} from "@entities/connector/api/connector.tags.ts";
import {connectorApi} from "@entities/connector/api/connectorApi.ts";
import {showApiError} from "@shared/api/handleApiError.ts";
import {useAppStore} from "@app/store/app.store.ts";
import {selectAccessToken} from "@entities/auth/model/authSelectors.ts";
import {genericApi} from "@shared/api/genericApi.ts";

const baseKey = 'connector';

const isImageFile = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File;

const resolveConnectorIconUrl = (icon?: string | null) => {
    if (!icon?.trim()) return null;
    if (/^(blob:|data:|https?:\/\/)/i.test(icon)) return icon;

    const normalizedIcon = icon.replace(/^\.\//, '');
    if (normalizedIcon.startsWith('storage/')) {
        const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
        return `${baseUrl}/${normalizedIcon}`;
    }

    return icon;
};

const renderConnectorIcon = (icon: unknown) => {
    const iconUrl = resolveConnectorIconUrl(typeof icon === 'string' ? icon : null);
    if (!iconUrl) return null;

    return (
        <img
            src={iconUrl}
            alt=""
            style={{
                width: 28,
                height: 28,
                objectFit: 'contain',
                display: 'block',
            }}
        />
    );
};

const renderConnectorTitle = (row: unknown, value: unknown) => {
    const connector = row as Connector;
    const icon = renderConnectorIcon(connector.icon);

    return (
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            {icon}
            <span>{String(value ?? '')}</span>
        </span>
    );
};

const uploadConnectorIcon = async (ctx: { formData?: ConnectorUpdateDto; response?: Connector; payload?: Connector }) => {
    const icon = ctx.formData?.icon;
    const connectorId = ctx.response?.connectorId ?? ctx.payload?.connectorId;

    if (!isImageFile(icon) || !connectorId) return;

    const formData = new FormData();
    formData.append('file', icon);
    formData.append('connectorId', String(connectorId));

    const token = selectAccessToken(store.getState());
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? '';
    const response = await fetch(`${baseUrl}/storage/connector`, {
        method: 'POST',
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
        body: formData,
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to upload connector icon: HTTP ${response.status}`);
    }

    store.dispatch(genericApi.util.invalidateTags(['Entity' as any]));
    store.dispatch(connectorApi.util.invalidateTags([
        {type: CONNECTOR_TAG, id: 'LIST'},
        {type: CONNECTOR_TAG, id: connectorId},
    ]));
};

export const connectorDefinition: EntityDefinition = {
    name: baseKey,
    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'edit' },
        { type: 'list' },
    ],
    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        defaultSort: { field: 'title', direction: 'asc' },
        pageSize: 10,
        bulkDelete: true,
    },
    i18n: {
        en,
        de,
    },
    api: {
        baseUrl: '/connector',
        identifierField: 'title',
        primaryKey: 'connectorId',
        resolveIdentifier: resolveConnectorTitles,
        mapToForm: ({requestData, invoker, timeout, ...connectorModel}: Connector): ConnectorUpdateDto => {
            return {
                ...connectorModel,
                timeout: timeout?.toString() ?? '',
                invoker: invoker?.name
            }
        },
        mapToApi: ({data: {invoker, timeout, requestData, icon, ...formData}, mode}: {data: ConnectorUpdateDto, mode: Mode}): Connector => {
            const payload: Connector = {
                ...formData,
                ...(typeof icon === 'string' ? {icon} : {}),
                timeout: +timeout,
                invoker: {
                    name: invoker,
                },
            }
            if (mode === 'create')  {
                payload.requestData = requestData;
            }
            return payload;
        },
        actions: {
            saveRequestData: {
                url: (ctx) => `/connector/${ctx.payload.connectorId}/required-data`,
                method: 'PUT',
                mapBody: (ctx) => ({
                    ...ctx.payload.requestData,
                }),
                mapHeaders: (ctx) => {
                    const masterPassword = useAppStore.getState().masterPassword
                    return {
                        'x-master-password': masterPassword,
                    }
                },
                condition: () => {
                    return !!useAppStore.getState().masterPassword;
                }
            },
            uploadIcon: {
                url: '/storage/connector',
                execute: uploadConnectorIcon,
                condition: (ctx) => isImageFile(ctx.formData?.icon),
            },
        },
        lifecycle: {
            create: {
                after: ['uploadIcon'],
            },
            update: {
                after: ['saveRequestData', 'uploadIcon'],
            }
        }
    },

    /* ===============================
       FIELDS
    ============================== */

    fields: [
        // General Data
        {
            name: 'title',
            type: 'string',
            defaultValue: 'test',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.title.label`
                }
            },
            validation: {
                required: true,
                max: 255,
                remote: {
                    url: `/connector/exists/:title`,
                    method: 'GET',
                    map: (fieldValue) => ({ title: fieldValue }),
                    transKey: `${baseKey}.fields.title.errors.title_already_exists`,
                    encodeParams: false,
                    handleResponse: (data, error) => {
                        return !data.result;
                    },
                    skipIfUnchanged: true
                }
            },

            table: {
                visible: true,
                order: 1,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.fields.title.label`,
                render: renderConnectorTitle,
            }
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
                max: 5000
            },

            table: {
                visible: true,
                order: 2,
                searchable: true,
                labelKey: `${baseKey}.fields.description.label`,
            }
        },
        {
            name: 'invoker',
            type: 'string',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.invoker.label`,
                    asyncOptions: {
                        url: '/invoker/all',
                        map: (data: any[]) => data.map(item => ({
                            value: item.name,
                            label: item.name
                        }))
                    }
                }
            },
            validation: {
                required: true,
            },
            table: {
                visible: true,
                order: 3,
                searchable: true,
                labelKey: `${baseKey}.fields.invoker.label`,
                mapToValue: (row, raw) => {
                    if (typeof raw === 'string') return raw;
                    if (raw && typeof raw === 'object' && 'name' in raw) {
                        return (raw as { name?: unknown }).name as string | undefined;
                    }
                    return undefined;
                },
            },
        },
        {
            name: 'timeout',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    labelKey: `${baseKey}.fields.timeout.label`
                }
            },
            validation: {
                max: 11
            },
        },
        {
            name: 'sslCert',
            type: 'boolean',
            defaultValue: true,
            ui: {
                component: 'switch',
                props: {
                    labelKey: `${baseKey}.fields.sslCert.label`,
                    textKey: {
                        on: `${baseKey}.fields.sslCert.text.on`,
                        off: `${baseKey}.fields.sslCert.text.off`,
                    }
                }
            },
        },
        {
            name: 'icon',
            type: 'other',
            ui: {
                component: 'file-dropzone',
                props: {
                    multiple: false,
                    accept: "image/png, image/jpeg",
                    labelKey: `${baseKey}.fields.image.label`,
                }
            },
        },
        //credentials
        {
            name: 'requestData',
            label: `${baseKey}.fields.requestData.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'credentialEditor',
            },
            validation: {
                custom: [
                    {
                        validate: (value, values, mode) =>
                            {
                                if (mode === 'update') {
                                    const masterPassword = useAppStore.getState().masterPassword
                                    if (!masterPassword) {
                                        return true;
                                    }
                                }
                                for (let param in value) {
                                    if (!value[param]) return false;
                                }
                                return true;
                            },

                        message: `${baseKey}.fields.requestData.errors.required`,
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
            id: 'general-data',
            fields: [
                'title',
                'description',
                'invoker',
                'timeout',
                'sslCert',
                'icon',
            ]
        },{
            id: 'credentials',
            fields: ['requestData']
        }
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: connectorWizardImage as string,
        imageField: 'icon',

        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: ConnectorUpdateDto) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.wizard.modes.create.successMessage`, { title: formData.title });
                },
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: ConnectorUpdateDto) => {
                    const t = i18n.getFixedT(i18n.language, 'entities');
                    return t(`${baseKey}.wizard.modes.update.successMessage`, { title: formData.title });
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
                link: '/connection/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.3`,
                link: '/invoker/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.4`,
                link: '/connector'
            },
        ],

        steps: [
            {
                id: 'general-data',
                header: `${baseKey}.wizard.steps.general-data.header`,
                subheader: `${baseKey}.wizard.steps.general-data.subheader`,
                sectionIds: ['general-data'],
                validateFields: ['title', 'invoker'],
            },
            {
                id: 'credentials',
                header: `${baseKey}.wizard.steps.credentials.header`,
                subheader: `${baseKey}.wizard.steps.credentials.subheader`,
                sectionIds: ['credentials'],
                validateFields: ['requestData'],
                remote: {
                    url: `/connector/check`,
                    method: 'POST',
                    transKey: `${baseKey}.wizard.steps.credentials.remote.error`,
                    encodeParams: false,
                    ignoreError: true,
                    map: (fieldValue, formValues) => ({...formValues, invoker: {name: formValues.invoker}}),
                    shouldSkip: () => {
                        const masterPassword = useAppStore.getState().masterPassword
                        return !masterPassword;
                    },
                    handleResponse: (data, error) => {
                        if (data?.status === "200") {
                            return true;
                        } else {
                            showApiError({
                                namespace: 'entities',
                                transKey:  `${baseKey}.wizard.steps.credentials.remote.error.${data.data.message}`,
                            })
                            return false;
                        }
                    }
                }
            },
        ]
    },
    commands: (def) => (
        [
            ...createEntityCommands({def, config: {}, dsl: {
                    update: {
                        by: [
                            { field: 'title', resolve: resolveConnectorTitles },
                            {
                                field: 'id',
                                resolve: resolveConnectorIds,
                                customPath: true,
                            }
                        ]
                    },
                    delete: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveConnectorIds,
                                customPath: true,
                                afterDelete: async () => {
                                    await store.dispatch(
                                        connectorApi.util.invalidateTags([
                                            { type: CONNECTOR_TAG, id: 'LIST' }
                                        ])
                                    );
                                },
                                confirmMessage: (id) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byId`, {id});
                                }
                            },
                            {
                                field: 'title',
                                resolve: resolveConnectorTitles,
                                confirmMessage: (title) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byTitle`, {title});
                                }
                            }
                        ]
                    },
                    view: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveConnectorIds,
                                customPath: true,
                            },
                            {
                                field: 'title',
                                resolve: resolveConnectorTitles
                            }
                        ]
                    }
                }})
        ]
    )
}
