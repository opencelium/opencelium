import type { JsonValue, UsageSourceType } from './types'

export const SECRET_MASK = '••••'
const PREVIEW_LENGTH = 100

export const previewValue = (value: JsonValue) => JSON.stringify(value).slice(0, PREVIEW_LENGTH)

export const sourceLink = (sourceType: UsageSourceType, sourceId: number): string | null => {
    switch (sourceType) {
        case 'WORKFLOW':
            return `/workflow/update/${sourceId}`
        case 'CONNECTOR':
            return `/connector/view/${sourceId}`
        case 'SCRIPT_VARIABLE':
            return `/global-variable/view/${sourceId}`
        case 'NOTIFICATION':
            return null
        default: {
            const _exhaustive: never = sourceType
            return _exhaustive
        }
    }
}
