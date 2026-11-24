export type NotificationToolId =
	| 'slack'
	| 'teams'
	| 'google-chat'
	| 'discord'
	| 'mattermost'
	| 'rocket-chat'
	| 'webex'
	| 'ntfy'
	| 'generic';

export type NotificationFact = { id: string; label: string; value: string };

export type NotificationFieldValue = string | boolean | NotificationFact[];

/** Editor field values of one tool, keyed by the tool's field keys. Strings may hold `{%…%}` references. */
export type NotificationMessageValues = Record<string, NotificationFieldValue>;

export type NotificationToolDraft = {
	webhookUrl: string;
	message: NotificationMessageValues;
	/** Hand-edited JSON body. While set it wins over the editor fields, which are then locked. */
	jsonOverride?: string;
};

export type NotificationEditMode = 'editor' | 'json';

export type NotificationErrorPolicy = 'stop' | 'continue' | 'retry';

export type NotificationHeader = { id: string; name: string; value: string };

export type NotificationConfig = {
	tool: NotificationToolId | null;
	/** Kept per tool so switching tools never loses what was entered for another one. */
	tools: Partial<Record<NotificationToolId, NotificationToolDraft>>;
	mode: NotificationEditMode;
	extraHeaders: NotificationHeader[];
	errorPolicy: NotificationErrorPolicy;
	retryOn429: boolean;
};

export type NotificationDialogStep = 1 | 2 | 3 | 4;

export type NotificationRequestSection = 'url' | 'headers' | 'body';

/** Where the dialog opens; context-menu entries jump straight to a step, tab or request section. */
export type NotificationDialogTarget =
	| { kind: 'default' }
	| { kind: 'step'; step: Exclude<NotificationDialogStep, 4> }
	| { kind: 'request'; section: NotificationRequestSection }
	| { kind: 'response' }
	| { kind: 'rename' };

export type NotificationEditorState = { nodeId: string; target: NotificationDialogTarget };
