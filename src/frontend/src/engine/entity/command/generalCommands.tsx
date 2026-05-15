import type {GeneralCommandType} from "@/engine/entity/command/types.ts";
import {CommandNode} from "@shared/command/types.ts";
import React from "react";
import {GenericEntityList} from "@/engine/entity/runtime/genererics/GenericEntityList.tsx";
import {GenericCreateWizard} from "@/engine/entity/runtime/genererics/GenericCreateWizard.tsx";
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";

export const getListCommand = ({def, config, name}: GeneralCommandType): CommandNode<any> => {
    const pluralName = def.plural || `${name}s`;
    return {
        type: 'literal',
        value: 'list',
        aliases: ['collections'],
        group: 'navigate',
        icon: 'list',
        description: 'commandPalette.descriptions.list',
        children: [{
            type: 'literal',
            value: pluralName,
            group: 'navigate',
            icon: 'list',
            execute: (_, ctx) => {
                const url = `/${def.name}`;
                const { mode } = useCommandPaletteUIStore.getState();

                if (mode === 'route') return ctx.navigate(url);
                if (mode === 'new-tab') return ctx.openNewTab(url);

                if (mode === 'modal') {
                    if (config?.overrides?.list) return ctx.openModal(config?.overrides.list(def, ctx));
                    return ctx.openModal(<GenericEntityList entityName={def.name} />);
                }
                if (config?.overrides?.list) return config?.overrides.list(def, ctx);
                ctx.render(<GenericEntityList entityName={def.name}/>);
            }
        }],
        ...config?.overrideProps?.['list'],
    };
}

export const getCreateCommand = ({ def, config, name }: GeneralCommandType): CommandNode<any> => ({
    type: 'literal',
    value: 'create',
    group: 'create',
    icon: 'plus',
    description: 'commandPalette.descriptions.create',
    children: [
        {
            type: 'literal',
            value: name,
            group: 'create',
            icon: 'plus',
            execute: (_, ctx) => {
                const url = `/${def.name}/create`;
                const { mode } = useCommandPaletteUIStore.getState();

                if (mode === 'route') {
                    return ctx.navigate(url);
                }

                if (mode === 'new-tab') {
                    return ctx.openNewTab(url);
                }

                if (mode === 'modal') {
                    if (config?.overrides?.create) return ctx.openModal(config.overrides.create(def, ctx));
                    return ctx.openModal(<GenericCreateWizard entityName={def.name} />);
                }
                // If a specific create flow is needed — use the override
                if (config?.overrides?.create) return config.overrides.create(def, ctx);
                // Otherwise — the standard Generic Wizard
                ctx.render(<GenericCreateWizard entityName={def.name} />);
            }
        }
    ],
    ...config?.overrideProps?.['create'],
});

