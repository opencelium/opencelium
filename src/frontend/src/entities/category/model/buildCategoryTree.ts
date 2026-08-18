import type { Category } from './types'

export type CategoryTreeNode = {
    value: number
    title: string
    children?: CategoryTreeNode[]
}

/** A category and every one of its descendants (including itself), via `parentCategory`. */
export function collectDescendantIds(categories: Category[], id: number): Set<number> {
    const result = new Set<number>([id])
    for (const c of categories) {
        if (c.parentCategory?.id === id) {
            collectDescendantIds(categories, c.id).forEach((d) => result.add(d))
        }
    }
    return result
}

/** Builds a `TreeSelect`-shaped tree from the flat category list, honoring parent/child nesting. */
export function buildCategoryTree(
    categories: Category[],
    excluded: Set<number> = new Set(),
    parentId: number | null = null,
): CategoryTreeNode[] {
    return categories
        .filter((c) => (c.parentCategory?.id ?? null) === parentId && !excluded.has(c.id))
        .map((c) => ({
            value: c.id,
            title: c.name,
            children: c.subCategories?.length
                ? buildCategoryTree(categories, excluded, c.id)
                : undefined,
        }))
}
