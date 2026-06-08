import { CommandNode } from '@shared/command/types';
import type {CreateEntityCommandsType, EntityCommandType} from "@/engine/entity/command/types.ts";
import {
    getCreateCommand,
    getListCommand,
} from "@/engine/entity/command/generalCommands.tsx";
import {createUpdateByCommand} from "@/engine/entity/command/update-by/createUpdateByCommand.tsx";
import {createDeleteByCommand} from "@/engine/entity/command/delete-by/createDeleteByCommand.tsx";
import {createViewByCommand} from "@/engine/entity/command/view-by/createViewByCommand.tsx";

export function createEntityCommands({def, config, dsl, commandName}: CreateEntityCommandsType): CommandNode<any>[] {
    if (!config) {
        config =  { include: ['create', 'list', 'update', 'view', 'delete'] }
    }
    const commands: CommandNode<any>[] = [];
    const name = (commandName ?? def.name).toLowerCase();

    const isEnabled = (type: EntityCommandType) => {
        if (config?.exclude?.includes(type)) return false;
        if (config?.include) return config.include.includes(type);
        return true;
    };

    // 1. LIST command (open users)
    if (isEnabled('list')) {
        commands.push(getListCommand({def, config, name}));
    }
    if (isEnabled('view')) {
        // =========================
        // VIEW
        // =========================
        if (dsl?.view?.by?.length) {
            dsl?.view.by.forEach((by) => {
                commands.push(
                    createViewByCommand({
                        def,
                        name,
                        config: {},
                        by
                    })
                );
            });
        } else {
            commands.push(
                createViewByCommand({
                    def,
                    name,
                    config: {},
                    by: {
                        field: def.api?.identifierField || 'id',
                        resolve: def.api?.resolveIdentifier
                    }
                })
            );
        }
    }

    // 2. CREATE command (create user)
    if (isEnabled('create')) {
        commands.push(getCreateCommand({def, config, name}));
    }

    // 3. UPDATE command (update user by email [value])
    if (isEnabled('update')) {
        if (dsl?.update?.by?.length) {
            dsl?.update.by.forEach((by) => {
                commands.push(
                    createUpdateByCommand({
                        def,
                        name,
                        config,
                        by
                    })
                );
            });
        } else {
            // fallback (if nothing is configured)
            commands.push(
                createUpdateByCommand({
                    def,
                    name,
                    config,
                    by: {
                        field: def.api?.identifierField || 'id',
                        resolve: def.api?.resolveIdentifier
                    }
                })
            );
        }
    }

    // 4. DELETE command (delete entity by string param [value])
    if (isEnabled('delete')) {
        if (dsl?.delete?.by?.length) {
            dsl?.delete.by.forEach((by) => {
                commands.push(
                    createDeleteByCommand({
                        def,
                        name,
                        config,
                        by
                    })
                );
            });
        } else {
            // fallback
            commands.push(
                createDeleteByCommand({
                    def,
                    name,
                    config,
                    by: {
                        field: def.api?.identifierField || 'id',
                        resolve: def.api?.resolveIdentifier
                    }
                })
            );
        }
    }

    return commands;
}
