import type { NotificationMessageValues, NotificationToolId } from '../model/notification.types';

/** Fields that accept references (`{%…%}`) and render as reference-aware text inputs. */
export type NotificationReferenceField = {
	kind: 'line' | 'area';
	key: string;
	labelKey: string;
	helpKey?: string;
	placeholderKey?: string;
};

export type NotificationField =
	| NotificationReferenceField
	| { kind: 'text'; key: string; labelKey: string; placeholderKey?: string }
	| { kind: 'select'; key: string; labelKey: string; options: { value: string; labelKey: string }[] }
	| { kind: 'color'; key: string; labelKey: string }
	| { kind: 'toggle'; key: string; labelKey: string }
	| { kind: 'facts'; key: string; labelKey: string };

export type NotificationFieldLayout =
	| NotificationField
	| { kind: 'row'; id: string; fields: NotificationField[] }
	| { kind: 'group'; id: string; titleKey: string; items: NotificationFieldLayout[] };

export type NotificationPreviewTone = 'good' | 'warning' | 'attention' | 'accent';

export type NotificationPreviewCard = {
	title?: string;
	titleTone?: NotificationPreviewTone;
	subtitle?: string;
	text?: string;
	facts: [string, string][];
	factsLayout: 'grid' | 'list';
	button?: string;
	accent?: string;
	isPlain?: boolean;
};

export type NotificationPreview =
	| { kind: 'chat'; author?: string; lead: string; tags: string[]; card: NotificationPreviewCard | null }
	| { kind: 'push'; topic: string; title: string; message: string; priority: number; tags: string[] }
	| { kind: 'raw'; json: string };

export type NotificationResponseParam = { path: string; labelKey: string; example: string };

export type NotificationResponseSpec = {
	status: string;
	contentType: 'application/json' | 'text/plain' | null;
	/** Example body as the tool documents it; JSON bodies also seed the reference picker of later steps. */
	sampleBody: string;
	params: NotificationResponseParam[];
};

export type NotificationToolGuide = {
	stepCount: number;
	facts: string[];
	noteCount: number;
	docsUrl?: string;
};

/** One messaging tool. i18n keys live under `notification.tools.<id>.*`. */
export type NotificationTool = {
	id: NotificationToolId;
	/** Product name — never translated. */
	name: string;
	/** Set when the name is not a product name and has to be translated. */
	nameKey?: string;
	abbreviation: string;
	brandColor: string;
	markup: 'slack' | 'markdown';
	isJsonOnly: boolean;
	isPush: boolean;
	webhook: { placeholder: string; pattern: RegExp };
	guide: NotificationToolGuide;
	response: NotificationResponseSpec;
	fields: NotificationFieldLayout[];
	createDefaults: () => NotificationMessageValues;
	buildBody: (values: NotificationMessageValues) => unknown;
	toPreview: (body: unknown) => NotificationPreview;
};
