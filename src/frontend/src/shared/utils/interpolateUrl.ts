export function interpolateUrl(
    url: string,
    params: Record<string, any>,
    encode = true
) {
    return Object.entries(params).reduce(
        (acc, [key, value]) =>
            acc.replace(
                `:${key}`,
                encode
                    ? encodeURIComponent(value)
                    : String(value)
            ),
        url
    )
}
