import type {DeleteByConfig, GeneralCommandType} from "@/engine/entity/command/types.ts";
import type {CommandNode} from "@shared/command/types.ts";
import {createDeleteExecute} from "@/engine/entity/command/delete-by/createDeleteExecute.tsx";
import {buildActionAccess} from "@/engine/policy";

export const createDeleteByCommand = ({
    def,
    name,
    config,
    by
}: GeneralCommandType & { by: DeleteByConfig }): CommandNode<any> => {

    return {
        type: 'literal',
        value: 'delete',
        aliases: ['remove', 'destroy'],
        group: 'manage',
        icon: 'delete',
        description: 'commandPalette.descriptions.delete',
        children: [
            {
                type: 'literal',
                value: name,
                group: 'manage',
                icon: 'delete',
                // The outer "delete" literal is shared/merged across every entity's delete
                // command — access must live on this entity-specific child node.
                access: def.permissionComponent ? buildActionAccess(def.permissionComponent, 'DELETE') : undefined,
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
                                        execute: createDeleteExecute({ def, config, by })
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        ...config?.overrideProps?.['delete'],
    };
};
