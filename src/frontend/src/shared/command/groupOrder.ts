// Shared by the live palette's suggestion dropdown and the help dialog's
// command reference so both present groups in the same, deliberate order
// instead of drifting into alphabetical (or two hand-maintained copies).
export const GROUP_ORDER = ['workflow', 'recent', 'navigate', 'create', 'manage', 'system', 'general']

export const orderGroups = (groups: string[]): string[] => {
    const known = GROUP_ORDER.filter((g) => groups.includes(g))
    const unknown = groups.filter((g) => !GROUP_ORDER.includes(g)).sort()
    return [...known, ...unknown]
}
