export const formatToolLabel = (raw: string): string => {
    const spaced = raw.replace(/_/g, ' ')
    if (spaced.length === 0) return spaced
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
