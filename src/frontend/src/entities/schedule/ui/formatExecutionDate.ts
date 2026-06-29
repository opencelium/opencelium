export function formatExecutionDate(timestamp: number): string {
    const d = new Date(timestamp)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}:${ss}`
}

// Compact time-only form for the running-executions stack, where several runs of
// the same day are listed and a full date would be too wide for the status column.
export function formatExecutionTime(timestamp: number): string {
    const d = new Date(timestamp)
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mi}:${ss}`
}
