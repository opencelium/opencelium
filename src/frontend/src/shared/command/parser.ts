import {getDynamicCommandTree} from './tree';
import type {ASTNode} from "@shared/command/ast.ts";
import {PolicyContext, policyEngine} from "@/engine/policy";
import type {CommandNode, Suggestion, SuggestionOption} from "@shared/command/types.ts";

type ParseResult = {
    ast: ASTNode[];
    suggestions: Suggestion[];
    isComplete: boolean;
};

export async function parseTokens(tokens: string[], policyContext: PolicyContext): Promise<ParseResult> {
    const commandTree = getDynamicCommandTree();

    const isAccessible = (node: CommandNode<any>) => {
        if (!node.access) return true;
        return policyEngine.evaluate(node.access, policyContext).allowed;
    };

    const toLiteralSuggestions = (
        nodes: CommandNode<any>[],
        inheritedGroup: string | undefined,
        opts: { includeAliases: boolean; filter?: (v: string) => boolean },
    ): Suggestion[] => {
        const out: Suggestion[] = [];
        nodes.forEach(n => {
            if (n.type !== 'literal' || !isAccessible(n)) return;
            const labels: string[] = [];
            if (n.value) labels.push(n.value);
            if (opts.includeAliases && n.aliases) labels.push(...n.aliases);
            labels.forEach(v => {
                if (opts.filter && !opts.filter(v)) return;
                out.push({
                    value: v,
                    icon: n.icon,
                    group: n.group ?? inheritedGroup,
                    description: n.description,
                    shortcut: n.shortcut,
                });
            });
        });
        return out;
    };

    const toResolvedSuggestions = (
        node: CommandNode<any>,
        values: SuggestionOption[],
        inheritedGroup: string | undefined,
    ): Suggestion[] => values.map(v => ({
        value: typeof v === 'string' ? v : v.value,
        label: typeof v === 'string' ? undefined : v.label,
        icon: node.icon,
        group: node.group ?? inheritedGroup,
        description: node.description,
        shortcut: node.shortcut,
    }));

    if (tokens.length === 0) {
        return {
            ast: [],
            suggestions: toLiteralSuggestions(commandTree, undefined, { includeAliases: false }),
            isComplete: false,
        };
    }

    let currentNodes = commandTree;
    let inheritedGroup: string | undefined = undefined;
    const ast: ASTNode[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const isLast = i === tokens.length - 1;

        // 1️⃣ literal exact
        const literalExact = currentNodes.find(n =>
            n.type === 'literal' &&
            isAccessible(n) &&
            (n.value === token || n.aliases?.includes(token))
        );

        if (literalExact) {
            ast.push({ node: literalExact, value: token });
            inheritedGroup = literalExact.group ?? inheritedGroup;
            currentNodes = literalExact.children ?? [];
            continue;
        }

        // 2️⃣ literal partial (only when it's the last token)
        if (isLast) {
            const suggestions = toLiteralSuggestions(currentNodes, inheritedGroup, {
                includeAliases: true,
                filter: v => v.startsWith(token),
            });

            if (suggestions.length > 0) {
                return {
                    ast,
                    suggestions,
                    isComplete: false,
                };
            }
        }

        // 3️⃣ entity
        const entityNode = currentNodes.find(
            n => n.type === 'entity' && isAccessible(n)
        );

        if (entityNode) {
            // Consume all remaining tokens as the entity value so that
            // multi-word identifiers (e.g. "new invoker") are treated as one.
            const entityValue = tokens.slice(i).join(' ');

            ast.push({
                node: entityNode,
                value: entityValue,
            });

            if (entityNode.resolve) {
                const values = await entityNode.resolve(entityValue);
                return {
                    ast,
                    suggestions: toResolvedSuggestions(entityNode, values, inheritedGroup),
                    isComplete: false,
                };
            }
            currentNodes = entityNode.children ?? [];
            break;
        }

        // 4️⃣ nothing matched
        return {
            ast,
            suggestions: [],
            isComplete: false,
        };
    }

    // if we fully walked through the tokens
    // and an entity is expected next → call resolve('')
    const nextEntity = currentNodes.find(n => n.type === 'entity');

    if (nextEntity && nextEntity.resolve) {
        const values = await nextEntity.resolve('');
        return {
            ast,
            suggestions: toResolvedSuggestions(nextEntity, values, inheritedGroup),
            isComplete: false,
        };
    }

    // otherwise return literal suggestions
    const suggestions = toLiteralSuggestions(currentNodes, inheritedGroup, {
        includeAliases: true,
    });

    const isComplete =
        ast.length > 0 &&
        ast[ast.length - 1].node.execute != null;

    return {
        ast,
        suggestions,
        isComplete,
    };
}
