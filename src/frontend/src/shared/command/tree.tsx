import { CommandNode } from './types';
import {systemCommands} from "@shared/command/systemCommands.tsx";
import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {mergeCommandNodes} from "@shared/command/utils/mergeNodes.ts";
export function getDynamicCommandTree(): CommandNode<any>[] {
    const allNodes: CommandNode<any>[] = [...systemCommands];

    // Iterate over all registered entities
    entityRegistry.getAll().forEach((entity) => {
        if (entity.commands) {
            // Generate nodes for this specific entity
            const entityNodes = entity.commands(entity);
            allNodes.push(...entityNodes);
        }
    });

    return mergeCommandNodes(allNodes);
}
