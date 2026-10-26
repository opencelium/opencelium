import type { Connector } from '@entities/connector/model/types';
import type { PlaygroundInputs } from './collectPlaygroundInputs';
import type { PlaygroundDraft, PlaygroundSentRequest } from './playground.types';
import { isSecretField, readConnectionFieldValue, SECRET_MASK } from './playgroundConnection';
import {
	connectionInputKey,
	parseInputValue,
	referenceInputKey,
	webhookInputKey,
	type InputValue,
} from './playgroundValues';
import {
	connectionFieldSubstitution,
	referenceSubstitution,
	resolveRequest,
	webhookSubstitution,
	type Substitution,
} from './resolveRequest';

type Args = {
	draft: PlaygroundDraft;
	inputs: PlaygroundInputs;
	values: Record<string, InputValue>;
	connector: Connector | undefined;
	requestData: Record<string, string>;
};

export type PreviewInputSource = 'reference' | 'webhook' | 'connection';

// A missing input is kept, without a value, so a preview can still show where it lands.
export type PreviewInput = Substitution & { key: string; source: PreviewInputSource; isMissing: boolean };

export function buildPreviewInputs({ inputs, values, connector, requestData }: Omit<Args, 'draft'>): PreviewInput[] {
	const hasValue = (key: string) => !!values[key]?.text.trim();
	return [
		...inputs.references.map((reference) => {
			const key = referenceInputKey(reference);
			const isMissing = !hasValue(key);
			return { ...referenceSubstitution(reference.reference, isMissing ? undefined : parseInputValue(values[key])),
				key, source: 'reference' as const, isMissing };
		}),
		...inputs.webhooks.map((webhook) => {
			const key = webhookInputKey(webhook);
			const isMissing = !hasValue(key);
			return { ...webhookSubstitution(webhook.name, isMissing ? undefined : parseInputValue(values[key])),
				key, source: 'webhook' as const, isMissing };
		}),
		...inputs.connectionFields.map(({ field }) => {
			const value = readConnectionFieldValue(connector, field, requestData);
			return { ...connectionFieldSubstitution(field, isSecretField(field) ? SECRET_MASK : value),
				key: connectionInputKey(field), source: 'connection' as const, isMissing: !value };
		}),
	];
}

// Only references show as chips in the request views; webhook and connector placeholders stay plain text.
export const buildChipInputs = (args: Omit<Args, 'draft'>) =>
	buildPreviewInputs(args).filter(({ source }) => source === 'reference');

// What the request will look like once sent; an input without a value keeps its placeholder.
export function previewRequest({ draft, ...args }: Args): PlaygroundSentRequest {
	return resolveRequest(draft, buildPreviewInputs(args).filter(({ isMissing }) => !isMissing));
}
