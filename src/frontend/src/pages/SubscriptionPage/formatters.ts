export const formatNumber = (value: number, lang: string) =>
    new Intl.NumberFormat(lang).format(value)

export const formatCompactNumber = (value: number, lang: string) =>
    new Intl.NumberFormat(lang, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)

export const formatDate = (epoch: number, lang: string) => {
    if (!epoch) return '-'
    return new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date(epoch))
}

export const formatDateTime = (epoch: number, lang: string) => {
    if (!epoch) return '-'
    const d = new Date(epoch)
    const time = new Intl.DateTimeFormat(lang, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(d)
    const weekday = new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d)
    const date = new Intl.DateTimeFormat(lang, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d)
    return `${time}  ${weekday}  ${date}`
}

export const formatPeriod = (start: number, end: number, lang: string) => {
    if (!start && !end) return '-'
    return `${formatDate(start, lang)} – ${formatDate(end, lang)}`
}
