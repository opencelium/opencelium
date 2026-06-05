import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import uiWizardImage from '@/assets/images/wizard/ui.gif'
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import {GenericUpdateWizard} from "@/engine/entity/runtime/genererics/GenericUpdateWizard.tsx";
import React from "react";
import {message} from "antd";
import type {CommandNode} from "@shared/command/types.ts";
import {i18n} from "@shared/i18n/config/i18n";
import {themeRegistry} from "@shared/theme/registry/themeRegistry.ts";
import {setGlobalTheme} from "@shared/theme/themeController.ts";
import {readStoredThemeId} from "@shared/theme/themeStorage.ts";
import {DEVICE_THEME_ID} from "@shared/theme/types.ts";

const baseKey = 'ui';

export const uiDefinition: EntityDefinition = {
    name: baseKey,

    fields: [
        {
            name: 'theme',
            type: 'string',
            getDefaultValue: async () => {
                const stored = readStoredThemeId();
                if (stored && (stored === DEVICE_THEME_ID || themeRegistry.has(stored))) return stored;
                return DEVICE_THEME_ID;
            },
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.theme.label`,
                    options: [
                        {value: DEVICE_THEME_ID, label: 'Device'},
                        ...themeRegistry.getAll().map(def => ({value: def.id, label: def.label})),
                    ],
                }
            }
        },
        {
            name: 'commandMode',
            type: 'string',
            getDefaultValue: async () => {
                const { mode } = useCommandPaletteUIStore.getState();
                return mode;
            },
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.commandNode.label`,
                    options: [
                        {value: 'inline', label: 'Inline'},
                        {value: 'modal', label: 'Modal'},
                        {value: 'route', label: 'Page'},
                        {value: 'new-tab', label: 'New Tab'},
                    ]
                }
            }
        },
    ],

    sections: [
        {
            id: 'theme',
            fields: ['theme'],
            overrideKey: 'uiThemeSection',
        },
        {
            id: 'commander',
            fields: ['commandMode'],
        },
    ],

    wizard: {
        image: uiWizardImage as string,

        modes: {
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
            },
        },

        recommendations: [
        ],

        steps: [
            {
                id: 'theme',
                header: `${baseKey}.wizard.steps.theme.header`,
                subheader: `${baseKey}.wizard.steps.theme.subheader`,
                sectionIds: ['theme'],
            },
            {
                id: 'commander',
                header: `${baseKey}.wizard.steps.commander.header`,
                subheader: `${baseKey}.wizard.steps.commander.subheader`,
                sectionIds: ['commander'],
            },
        ]
    },
    commands: (def): CommandNode<any>[] => {
        return [
            {
                type: 'literal',
                value: 'system',
                aliases: ['set'],
                children: [{
                    type: 'literal',
                    value: 'ui',
                    execute: (args, ctx) => {
                        const { mode } = useCommandPaletteUIStore.getState();
                        const url = `/ui/config`;

                        const wizard = (
                            <GenericUpdateWizard
                                entityName={baseKey}
                                identifier={args.identifier as string}
                            />
                        );
                        if (mode === 'route') return ctx.navigate(url);
                        if (mode === 'new-tab') return ctx.openNewTab(url);

                        if (mode === 'modal') {
                            return ctx.openModal(wizard);
                        }
                        ctx.render(wizard);
                    }
                }]
            },
            {
                type: 'literal',
                value: 'ui',
                group: 'system',
                icon: 'settings',
                description: 'commandPalette.descriptions.changeTheme',
                children: [{
                    type: 'literal',
                    value: 'theme',
                    aliases: ['design'],
                    icon: 'settings',
                    description: 'commandPalette.descriptions.changeTheme',
                    children: [{
                        type: 'entity',
                        name: 'theme',
                        resolve: async (input) => {
                            const all = [
                                DEVICE_THEME_ID,
                                ...themeRegistry.getAll().map(t => t.id),
                            ];
                            const query = typeof input === 'string' ? input.trim().toLowerCase() : '';
                            if (!query) return all;
                            // match ids and display labels ("opencelium" finds ci-light/ci-dark)
                            return all.filter(id =>
                                id.toLowerCase().includes(query) ||
                                themeRegistry.get(id)?.label.toLowerCase().includes(query)
                            );
                        },
                        execute: ({ theme }) => {
                            if (typeof theme !== 'string') return;
                            if (theme !== DEVICE_THEME_ID && !themeRegistry.has(theme)) return;
                            if (!setGlobalTheme(theme)) return;
                            const tEntities = i18n.getFixedT(i18n.language, 'entities');
                            message.success(tEntities('ui.messages.themeUpdated'));
                        },
                    }],
                }],
            },
        ]
    }
}
