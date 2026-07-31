import type { SupportFile } from './types'

export type SupportFileRunStatus = 'success' | 'fail' | 'unknown'

/** Pull the trailing zip filename out of `/connection/support-file/68/2026-05-06_10-11_68_f_82.zip`. */
export function extractFilename(supportFile: string): string {
    if (!supportFile) return ''
    const slash = supportFile.lastIndexOf('/')
    return slash === -1 ? supportFile : supportFile.slice(slash + 1)
}

/**
 * Expected filename shape: `YYYY-MM-DD_HH-mm_<connectionId>_<f|s>_<runId>.zip`.
 * Returns ISO-ish `YYYY-MM-DD HH:mm` or an empty string when the name does not match.
 */
export function extractTimestamp(supportFile: string): string {
    const name = extractFilename(supportFile)
    const parts = name.split('_')
    if (parts.length < 2) return ''
    const date = parts[0]
    const time = parts[1]?.replace('-', ':')
    if (!date || !time) return ''
    return `${date} ${time}`
}

/** Returns a numeric timestamp suitable for sorting; falls back to 0 when parsing fails. */
export function extractTimestampValue(supportFile: string): number {
    const name = extractFilename(supportFile)
    const parts = name.split('_')
    if (parts.length < 2) return 0
    const [date, time] = parts
    const isoTime = time?.replace('-', ':')
    const t = Date.parse(`${date}T${isoTime ?? '00:00'}`)
    return Number.isFinite(t) ? t : 0
}

/** `_f_` => fail, `_s_` => success. Anything else falls back to `unknown`. */
export function extractRunStatus(supportFile: string): SupportFileRunStatus {
    const name = extractFilename(supportFile)
    const parts = name.split('_')
    const flag = parts[3]
    if (flag === 'f') return 'fail'
    if (flag === 's') return 'success'
    return 'unknown'
}

export function getSupportFileBasename(row: SupportFile): string {
    return extractFilename(row.supportFile)
}
