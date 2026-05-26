import defaultConnectorImage from '@/assets/images/default_connector.png'

export { defaultConnectorImage }

export const resolveConnectorIconUrl = (icon?: string | null): string | null => {
    if (!icon?.trim()) return null
    if (/^(blob:|data:|https?:\/\/)/i.test(icon)) return icon

    const normalizedIcon = icon.replace(/^\.\//, '')
    if (normalizedIcon.startsWith('storage/')) {
        const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')
        return `${baseUrl}/${normalizedIcon}`
    }

    return icon
}
