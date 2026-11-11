import type { GatewayConfig } from './config.ts'

export type ModelRole = 'workflowModel' | 'commandModel' | 'lightModel' | 'helpModel'

/**
 * Which configured model each user-facing AI feature runs on: the one place this is decided. Routes ask `modelFor`,
 * and `/health` reports the table so the app's AI settings page shows what is actually used.
 */
export const FEATURE_MODELS = {
    'generate-workflow': 'workflowModel',
    'suggest-mapping': 'workflowModel',
    'build-condition': 'workflowModel',
    'explain-connector-error': 'workflowModel',
    'invoker-from-docs': 'workflowModel',
    'draft-notification': 'workflowModel',
    'help': 'helpModel',
    /** Rewords a follow-up question into one that stands alone before the docs are searched. */
    'help-follow-up': 'commandModel',
    'explain-workflow': 'lightModel',
    'transformation-script': 'lightModel',
    'run-explain-fix': 'lightModel',
    'command-palette': 'commandModel',
    'editor-requests': 'commandModel',
} as const satisfies Record<string, ModelRole>

export type AiFeature = keyof typeof FEATURE_MODELS

export const AI_FEATURES = Object.keys(FEATURE_MODELS) as AiFeature[]

export const isAiFeature = (value: string): value is AiFeature => value in FEATURE_MODELS

/** The feature's own model when one is set on the AI settings page, else its role's. */
export const modelFor = (config: GatewayConfig, feature: AiFeature): string =>
    config.featureModels[feature] ?? config[FEATURE_MODELS[feature]]
