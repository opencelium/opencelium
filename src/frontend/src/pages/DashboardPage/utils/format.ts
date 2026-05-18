export const formatNumber = (value: number, lang: string): string =>
    new Intl.NumberFormat(lang).format(value)

export const formatPercent = (value: number, lang: string, fractionDigits = 1): string =>
    `${new Intl.NumberFormat(lang, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)}%`

export const formatDuration = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.round(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (minutes <= 0) return `${seconds}s`
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

export const formatBytes = (bytes: number, lang: string): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let value = Math.max(0, bytes)
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }
    const formatter = new Intl.NumberFormat(lang, {
        minimumFractionDigits: unitIndex === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })
    return `${formatter.format(value)} ${units[unitIndex]}`
}

export const formatDelta = (value: number, lang: string): string => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${new Intl.NumberFormat(lang, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value)}%`
}
