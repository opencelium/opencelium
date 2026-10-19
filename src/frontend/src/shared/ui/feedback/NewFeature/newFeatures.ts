import type { I18nSchema } from '@shared/i18n/types/schemes/schemes'
import type { DeepKeys } from '@shared/i18n/types/types'

type CommonKey = DeepKeys<I18nSchema['common']>

export type NewFeatureEntry = {
    /** Release (major.minor) that introduced the feature; the badge disappears once the backend runs a later one. */
    since: string
    descriptionKey: CommonKey
}

/**
 * Deleting an entry once its release is old turns every remaining `<NewFeature id>`
 * for it into a compile error — that is the cleanup reminder.
 */
export const NEW_FEATURES = {
    'workflow-template-json-edit': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowTemplateJsonEdit.description',
    },
    'enhancement-script-sandbox': {
        since: '5.3',
        descriptionKey: 'newFeature.enhancementScriptSandbox.description',
    },
} as const satisfies Record<string, NewFeatureEntry>

export type NewFeatureId = keyof typeof NEW_FEATURES
