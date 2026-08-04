import type {GeneralCommandType, UpdateByConfig} from "@/engine/entity/command/types.ts";
import type {CommandNode} from "@shared/command/types.ts";
import {createUpdateExecute} from "@/engine/entity/command/update-by/createUpdateExecute.tsx";
import {buildActionAccess} from "@/engine/policy";

export const createUpdateByCommand = ({
    def,
    name,
    config,
    by
}: GeneralCommandType & { by: UpdateByConfig }): CommandNode<any> => {

    const field = by.field;

    return {
        type: 'literal',
        value: 'update',
        group: 'manage',
        icon: 'edit',
        description: 'commandPalette.descriptions.update',
        children: [{
            type: 'literal',
            value: name,
            group: 'manage',
            icon: 'edit',
            // The outer "update" literal is shared/merged across every entity's update
            // command — access must live on this entity-specific child node.
            access: def.permissionComponent ? buildActionAccess(def.permissionComponent, 'UPDATE') : undefined,
            children: [{
                type: 'literal',
                value: 'by',
                children: [{
                    type: 'literal',
                    value: field,
                    children: [{
                        type: 'entity',
                        name: 'identifier',
                        resolve: by.resolve ?? def.api?.resolveIdentifier,
                        execute: createUpdateExecute({ def, config, by })
                    }]
                }]
            }]
        }],
        ...config?.overrideProps?.['update'],
    };
};
