import { CommandNode } from '../types';

export function mergeCommandNodes(nodes: CommandNode<any>[]): CommandNode<any>[] {
    const merged: Map<string, CommandNode<any>> = new Map();

    nodes.forEach((node) => {
        // Uniqueness key: type + value (for example, "literal:open")
        const key = `${node.type}:${node.value || node.name}`;

        if (merged.has(key)) {
            const existing = merged.get(key)!;

            // If both nodes have children — merge them recursively
            if (node.children || existing.children) {
                existing.children = mergeCommandNodes([
                    ...(existing.children || []),
                    ...(node.children || [])
                ]);
            }

            // Merge aliases, excluding duplicates
            if (node.aliases || existing.aliases) {
                existing.aliases = Array.from(new Set([
                    ...(existing.aliases || []),
                    ...(node.aliases || [])
                ]));
            }

            // If the new node has an execute (rare for parent nodes),
            // we could decide which one wins, or keep the existing one
        } else {
            // If no such node exists yet — clone it into the Map
            merged.set(key, { ...node });
        }
    });

    return Array.from(merged.values());
}
