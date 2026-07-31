import type { CommandNode } from '@shared/command/types'
import { policyEngine, type PolicyContext } from '@/engine/policy'

export type CommandReferenceEntry = {
    phrase: string
    description?: string
}

export type CommandReferenceGroup = {
    group: string
    entries: CommandReferenceEntry[]
}

const isAccessible = (node: CommandNode<unknown>, policyContext: PolicyContext): boolean =>
    !node.access || policyEngine.evaluate(node.access, policyContext).allowed

// Walks a node's literal path down to the first executable leaf, turning every
// entity/argument placeholder along the way into a `<name>` token — this is
// what makes the reference generic across every entity's create/update/view/
// delete-by-field command shape without hand-listing each one.
function collect(
    node: CommandNode<unknown>,
    pathWords: string[],
    inheritedDescription: string | undefined,
    policyContext: PolicyContext,
    out: CommandReferenceEntry[],
): void {
    if (!isAccessible(node, policyContext)) return

    const word = node.type === 'entity' || node.type === 'argument' ? `<${node.name}>` : (node.value ?? '')
    const words = word ? [...pathWords, word] : pathWords
    const description = node.description ?? inheritedDescription

    if (node.execute || !node.children?.length) {
        if (words.length) out.push({ phrase: words.join(' '), description })
        return
    }

    node.children.forEach((child) => collect(child, words, description, policyContext, out))
}

// Builds a flat, always-in-sync reference of every phrase a user can type,
// grouped by the top-level node's `group` (create/manage/navigate/system/...)
// — derived straight from the live command tree instead of a hand-maintained
// list, so it never drifts as entities register new commands.
export function buildCommandReference(
    tree: CommandNode<unknown>[],
    policyContext: PolicyContext,
): CommandReferenceGroup[] {
    const byGroup = new Map<string, CommandReferenceEntry[]>()

    tree.forEach((node) => {
        if (node.type !== 'literal' || !isAccessible(node, policyContext)) return
        const entries: CommandReferenceEntry[] = []
        collect(node, [], undefined, policyContext, entries)
        if (!entries.length) return

        const groupKey = node.group ?? 'general'
        const existing = byGroup.get(groupKey) ?? []
        byGroup.set(groupKey, [...existing, ...entries])
    })

    return Array.from(byGroup.entries())
        .map(([group, entries]) => ({
            group,
            entries: entries.sort((a, b) => a.phrase.localeCompare(b.phrase)),
        }))
        .sort((a, b) => a.group.localeCompare(b.group))
}
