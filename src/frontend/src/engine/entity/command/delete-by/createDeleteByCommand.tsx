import type {DeleteByConfig, GeneralCommandType} from "@/engine/entity/command/types.ts";
import type {CommandNode} from "@shared/command/types.ts";
import {createDeleteExecute} from "@/engine/entity/command/delete-by/createDeleteExecute.tsx";

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
