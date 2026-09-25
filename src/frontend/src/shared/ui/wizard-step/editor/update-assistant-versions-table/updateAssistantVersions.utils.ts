import type { UpdateVersion, UpdateVersionStatus } from '@entities/updateAssistant/model/types'

export const STATUS_COLOR: Record<UpdateVersionStatus, string> = {
    old: 'var(--color-text-secondary)',
    current: 'var(--color-text-primary)',
    available: 'var(--color-status-success-fg)',
}

function parseSemver(v: string): number[] {
    return v.split('.').map((p) => parseInt(p, 10) || 0)
}

export function sortVersionsDesc(versions: UpdateVersion[]): UpdateVersion[] {
    return [...versions].sort((a, b) => {
        const av = parseSemver(a.name)
        const bv = parseSemver(b.name)
        for (let i = 0; i < Math.max(av.length, bv.length); i++) {
            const diff = (bv[i] ?? 0) - (av[i] ?? 0)
            if (diff !== 0) return diff
        }
        return 0
    })
}

// "select" and "action" only ever hold a single control (a radio / an icon
// button), so they're pinned to a minimal fixed width, leaving the rest of
// the table's width to split evenly across name/status/changelog.
export const SELECT_COLUMN_WIDTH = 48
export const ACTION_COLUMN_WIDTH = 48

export function equalColumnWidth(isOffline: boolean): string {
    const fixed = SELECT_COLUMN_WIDTH + (isOffline ? ACTION_COLUMN_WIDTH : 0)
    return `calc((100% - ${fixed}px) / 3)`
}
