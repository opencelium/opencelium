import type {ConfigNode} from '@entities/systemConfig/model/types'
import {isContainerNode} from '@entities/systemConfig/model/types'

/** The last dotted segment of a key/path — the field label shown in the UI. */
export function nodeLabel(key: string): string {
    const lastDot = key.lastIndexOf('.')
    return lastDot >= 0 ? key.slice(lastDot + 1) : key
}

/** Flatten the config tree into a `path -> node` lookup, walking containers. */
export function buildNodeByPathMap(fields: ConfigNode[]): Map<string, ConfigNode> {
    const map = new Map<string, ConfigNode>()
    const walk = (nodes: ConfigNode[]) => {
        for (const node of nodes) {
            map.set(node.path, node)
            if (isContainerNode(node)) walk(node.value as ConfigNode[])
        }
    }
    walk(fields)
    return map
}

/**
 * Flat label search over the whole tree (case-insensitive substring on the
 * field label), mirroring the system-config page filter but returning a flat,
 * capped list of matching nodes for the command palette.
 */
export function searchConfigByLabel(fields: ConfigNode[], query: string, limit: number): ConfigNode[] {
    const q = query.trim().toLowerCase()
    const out: ConfigNode[] = []
    const walk = (nodes: ConfigNode[]) => {
        for (const node of nodes) {
            if (out.length >= limit) return
            if (nodeLabel(node.key).toLowerCase().includes(q)) out.push(node)
            if (isContainerNode(node)) walk(node.value as ConfigNode[])
        }
    }
    walk(fields)
    return out
}
