type MajorMinor = { major: number; minor: number }

export function parseMajorMinor(version: string): MajorMinor | null {
    const match = /(\d+)\.(\d+)/.exec(version)
    return match ? { major: Number(match[1]), minor: Number(match[2]) } : null
}

/** Sort comparator over major.minor; unparseable versions sort first. */
export function compareMajorMinor(a: string, b: string): number {
    const left = parseMajorMinor(a)
    const right = parseMajorMinor(b)
    if (!left || !right) return Number(Boolean(left)) - Number(Boolean(right))
    return left.major - right.major || left.minor - right.minor
}

/** True while the running release is not newer than `since` — a 5.3 feature shows on 5.2 and 5.3 builds, not on 5.4. */
export function isFeatureCurrent(since: string, runningVersion: string | undefined): boolean {
    if (!runningVersion || !parseMajorMinor(runningVersion) || !parseMajorMinor(since)) return false
    return compareMajorMinor(runningVersion, since) <= 0
}
