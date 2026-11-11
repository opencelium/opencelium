/** The gateway's AI features (`src/ai-gateway/src/featureModels.ts`), in the order the AI settings page lists them. */
export const AI_FEATURE_IDS = [
	'generate-workflow', 'explain-workflow', 'suggest-mapping', 'build-condition', 'transformation-script',
	'run-explain-fix', 'explain-connector-error', 'editor-requests',
	'invoker-from-docs', 'draft-notification', 'help', 'command-palette', 'help-follow-up',
] as const;

export type AiFeatureId = (typeof AI_FEATURE_IDS)[number];

/** What an admin can switch off, grouped as the app shows them; the help follow-up rewording is part of `help`. */
export const SWITCHABLE_AI_FEATURES = {
	editor: ['generate-workflow', 'explain-workflow', 'suggest-mapping', 'build-condition', 'transformation-script',
		'run-explain-fix', 'explain-connector-error', 'editor-requests'],
	elsewhere: ['invoker-from-docs', 'draft-notification', 'help', 'command-palette'],
} as const satisfies Record<string, readonly AiFeatureId[]>;
