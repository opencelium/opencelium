export const formatNumber = (value: number, lang: string): string =>
    new Intl.NumberFormat(lang).format(value)

export const formatPercent = (value: number, lang: string, fractionDigits = 1): string =>
    `${new Intl.NumberFormat(lang, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)}%`

export const formatDuration = (milliseconds: number): string => {
    const seconds = milliseconds / 1000

    if (seconds >= 3600) {
        return `${(seconds / 3600).toFixed(3)} h`
    }

    if (seconds >= 60) {
        return `${Math.floor(seconds / 60)} min`
    }

    return `${Math.floor(seconds)} sec`
}

export const formatKilobytes = (kb: number): string => {
    const MB = 1024
    const GB = 1024 * 1024

    if (kb < 1) {
        return '< 1 KB'
    }

    if (kb < MB) {
        return `${Math.floor(kb)} KB`
    }

    if (kb < GB) {
        const mb = kb / MB
        return `${mb.toFixed(2).replace('.', ',')} MB`
    }

    const gb = kb / GB
    return `${gb.toFixed(2).replace('.', ',')} GB`
}

export const calculateClampedPercentage = (total: number, value: number): number => {
    if (total <= 0) return 0
    if (value <= 0) return 0
    if (value >= total) return 100

    const percentage = Math.round((value / total) * 100)

    return Math.min(99, Math.max(1, percentage))
}
