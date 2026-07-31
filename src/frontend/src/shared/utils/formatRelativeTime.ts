const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

// Locale-aware "2 minutes ago" / "vor 2 Minuten" via Intl.RelativeTimeFormat —
// no translation keys needed since the unit/number formatting is locale-native.
export function formatRelativeTime(epochMillis: number, locale: string, now: number = Date.now()): string {
    let duration = (epochMillis - now) / 1000
    for (const division of DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(duration), division.unit)
        }
        duration /= division.amount
    }
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(duration), 'year')
}
