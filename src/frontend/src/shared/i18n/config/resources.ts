import { locales } from '../locales'

export const resources = Object.fromEntries(
    Object.entries(locales).map(([lang, namespaces]) => [
        lang,
        namespaces,
    ])
)
