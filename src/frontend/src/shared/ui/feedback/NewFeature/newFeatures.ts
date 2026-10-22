import type { I18nSchema } from '@shared/i18n/types/schemes/schemes'
import type { DeepKeys } from '@shared/i18n/types/types'

type CommonKey = DeepKeys<I18nSchema['common']>

export type NewFeatureEntry = {
    /** Release (major.minor) that introduced the feature; the badge disappears once the backend runs a later one. */
    since: string
    descriptionKey: CommonKey
    /** Card title; without it the control's tooltip text titles the card. Set it when that text is a sentence, not a name. */
    titleKey?: CommonKey
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
    'workflow-reference-operations': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowReferenceOperations.description',
    },
    'workflow-connector-http-method': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowConnectorHttpMethod.description',
        titleKey: 'newFeature.workflowConnectorHttpMethod.title',
    },
    'workflow-header-user-actions': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowHeaderUserActions.description',
    },
    'workflow-test-method': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowTestMethod.description',
        titleKey: 'newFeature.workflowTestMethod.title',
    },
    'workflow-problems': {
        since: '5.3',
        descriptionKey: 'newFeature.workflowProblems.description',
        titleKey: 'newFeature.workflowProblems.title',
    },
    'sidebar-back-to-main-menu': {
        since: '5.3',
        descriptionKey: 'newFeature.sidebarBackToMainMenu.description',
        titleKey: 'newFeature.sidebarBackToMainMenu.title',
    },
} as const satisfies Record<string, NewFeatureEntry>

export type NewFeatureId = keyof typeof NEW_FEATURES
