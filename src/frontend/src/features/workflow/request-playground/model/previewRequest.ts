import type { Connector } from '@entities/connector/model/types';
import type { PlaygroundInputs } from './collectPlaygroundInputs';
import type { PlaygroundDraft, PlaygroundSentRequest } from './playground.types';
import { isSecretField, readConnectionFieldValue, SECRET_MASK } from './playgroundConnection';
import { parseInputValue, referenceInputKey, webhookInputKey, type InputValue } from './playgroundValues';
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

// What the request will look like once sent; an input without a value keeps its placeholder.
export function previewRequest({ draft, inputs, values, connector, requestData }: Args): PlaygroundSentRequest {
	const hasValue = (key: string) => !!values[key]?.text.trim();
	const substitutions: Substitution[] = [
		...inputs.references
			.filter((reference) => hasValue(referenceInputKey(reference)))
			.map((reference) => referenceSubstitution(reference.reference,
				parseInputValue(values[referenceInputKey(reference)]))),
		...inputs.webhooks
			.filter((webhook) => hasValue(webhookInputKey(webhook)))
			.map((webhook) => webhookSubstitution(webhook.name, parseInputValue(values[webhookInputKey(webhook)]))),
		...inputs.connectionFields
			.filter(({ field }) => !!readConnectionFieldValue(connector, field, requestData))
			.map(({ field }) => connectionFieldSubstitution(field,
				isSecretField(field) ? SECRET_MASK : readConnectionFieldValue(connector, field, requestData))),
	];
	return resolveRequest(draft, substitutions);
}
