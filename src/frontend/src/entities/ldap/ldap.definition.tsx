import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import roleWizardImage from '@assets/images/wizard/ldap.gif'
import {resolveUserEmails} from "@entities/user/command/resolvers/resolveUserEmails.ts";
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import React from "react";
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";
import en from "@entities/ldap/i18n/en.json";
import de from "@entities/ldap/i18n/de.json";
import {useLdapStore} from "@entities/ldap/ldap.store.ts";
import type {CommandNode} from "@shared/command/types.ts";

const baseKey = 'ldap';

export const ldapDefinition: EntityDefinition = {
    name: baseKey,
    i18n: {
        en,
        de,
    },
    /* ===============================
       FIELDS
    ============================== */

    fields: [
        // Configurations
        {
            name: 'urls',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.urls.label`
                }
            },
            validation: {
                required: true,
                max: 2048
            },
        },
        {
            name: 'userDN',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.userDN.label`
                }
            },
            validation: {
                max: 256
            },
        },
        {
            name: 'groupDN',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.groupDN.label`
                }
            },
            validation: {
                max: 256
            },
        },
        {
            name: 'username',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.username.label`
                }
            },
            validation: {
                required: true,
                max: 256
            },
        },
        {
            name: 'password',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.password.label`
                }
            },
            validation: {
                max: 256
            },
        },
        {
            name: 'userSearchFilter',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.userSearchFilter.label`
                }
            },
            validation: {
                max: 256
            },
        },
        {
            name: 'groupSearchFilter',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    readOnly: true,
                    labelKey: `${baseKey}.fields.groupSearchFilter.label`
                }
            },
            validation: {
                max: 256
            },
        },

        //LDAP Logs
        {
            name: 'logs',
            label: `${baseKey}.fields.logs.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'ldapLogs',
            },
        }
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'configuration',
            fields: [
                'urls',
                'userDN',
                'groupDN',
                'username',
                'password',
                'userSearchFilter',
                'groupSearchFilter',
            ]
        },
        {
            id: 'logs',
            fields: [
                'logs'
            ]
        },
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: roleWizardImage as string,

        modes: {
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.header`,
            }
        },

        recommendations: [
            {
                title: `${baseKey}.wizard.recommendations.1`,
                link: '/user/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/group/create'
            },
        ],
        steps: [
            {
                id: 'configuration',
                header: `${baseKey}.wizard.steps.configurations.header`,
                subheader: `${baseKey}.wizard.steps.configurations.subheader`,
                sectionIds: ['configuration'],
                actions: {
                    nextLabel: `${baseKey}.wizard.steps.configurations.actions.nextLabel`,
                },
                validateFields: ['urls', 'username'],
                remote: {
                    url: `/ldap/test`,
                    method: 'POST',
                    transKey: `${baseKey}.wizard.steps.configuration.remote.error`,
                    ignoreError: true,
                    encodeParams: false,
                    map: (fieldValue, formValues) => formValues,
                    handleResponse: (data, error) => {
                        const {setLogs} = useLdapStore.getState();
                        if (data?.status === 400) {
                            setLogs(data.data);
                            return true
                        }

                        // Status 200 means valid
                        if (data?.status === 200) {
                            //return `${baseKey}.fields.email.errors.email_already_exists`
                            return true;
                        }

                        return 'Validation failed'
                    }
                }
            },
            {
                id: 'logs',
                header: `${baseKey}.wizard.steps.logs.header`,
                subheader: `${baseKey}.wizard.steps.logs.subheader`,
                sectionIds: ['logs'],
            }
        ]
    },
    commands: (def): CommandNode<any>[] => {
        return [
            {
                type: 'literal',
                value: 'check',
                children: [
                    {
                        type: 'literal',
                        value: 'ldap',
                        execute: (_, ctx) => {
                            const url = `/ldap/check`;
                            const mode = useCommandPaletteUIStore.getState().resolveMode();

                            if (mode === 'route') {
                                return ctx.navigate(url);
                            }

                            if (mode === 'new-tab') {
                                return ctx.openNewTab(url);
                            }

                            if (mode === 'modal') {
                                return ctx.openModal(<EntityWizard
                                    entityName={'ldap'}
                                    mode="view"
                                    onSubmit={() => {}}
                                />);
                            }
                            ctx.render(<EntityWizard
                                entityName={'ldap'}
                                mode="view"
                                onSubmit={() => {}}
                            />);
                        }
                    }
                ],
            }
        ]
    }
}
