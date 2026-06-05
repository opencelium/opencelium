import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import uiWizardImage from '@/assets/images/wizard/ui.gif'
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import {GenericUpdateWizard} from "@/engine/entity/runtime/genererics/GenericUpdateWizard.tsx";
import React from "react";
import type {CommandNode} from "@shared/command/types.ts";
import {themeRegistry} from "@shared/theme/registry/themeRegistry.ts";
import {readStoredThemeId} from "@shared/theme/themeStorage.ts";

const baseKey = 'ui';

export const uiDefinition: EntityDefinition = {
    name: baseKey,

    fields: [
        {
            name: 'theme',
            type: 'string',
            getDefaultValue: async () => {
                const stored = readStoredThemeId();
                return stored && themeRegistry.has(stored) ? stored : themeRegistry.getDefault().id;
            },
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.theme.label`,
                    options: themeRegistry.getAll().map(def => ({value: def.id, label: def.label})),
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
            }
        ]
    }
}
