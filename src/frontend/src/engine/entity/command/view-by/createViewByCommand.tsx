import type {GeneralCommandType, ViewByConfig} from "@/engine/entity/command/types.ts";
import type {CommandNode} from "@shared/command/types.ts";
import {createViewExecute} from "@/engine/entity/command/view-by/createViewExecute.tsx";
import {buildActionAccess} from "@/engine/policy";

export const createViewByCommand = ({
    def,
    name,
    config,
    by
}: GeneralCommandType & { by: ViewByConfig }): CommandNode<any> => {

    const node: CommandNode<any> = {
        type: 'literal',
        value: name,
        group: 'navigate',
        icon: 'search',
        // The outer "find" literal is shared/merged across every entity's view
        // command — access must live on this entity-specific child node.
        access: def.permissionComponent ? buildActionAccess(def.permissionComponent, 'READ') : undefined,
        children: [
            {
                type: 'literal',
                value: 'by',
                children: [
                    {
                        type: 'literal',
                        value: by.field,
                        children: [
                            {
                                type: 'entity',
                                name: 'identifier',
                                resolve: by.resolve ?? def.api?.resolveIdentifier,
                                execute: createViewExecute({ def, config, by })
                            }
                        ]
                    }
                ]
            }
        ]
    };

    return {
        type: 'literal',
        value: 'find',
        aliases: ['open', 'view', 'get'],
        group: 'navigate',
        icon: 'search',
        description: 'commandPalette.descriptions.find',
        children: [node],
        ...config?.overrideProps?.['view'],
    };
};
