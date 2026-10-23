import { formatParsedArgPath } from '../../../components/request-editor/utils/parseEnhancementArg';
import type { InputLocation, InputTarget, PlaygroundInputs } from '../../model/collectPlaygroundInputs';
import { isSecretField } from '../../model/playgroundConnection';
import { connectionInputKey, referenceInputKey, webhookInputKey } from '../../model/playgroundValues';

type Translate = (key: string, options?: Record<string, unknown>) => string;

// `field` is what needs a value (the reference's field path, the webhook parameter, the
// connection field); `description` names its source and where the value lands in the request.
type RowBase = { key: string; group: InputLocation; field: string; description: string };

export type ValueRow =
	| RowBase & { kind: 'input'; color?: string }
	| RowBase & { kind: 'connection'; connectionField: string; isSecret: boolean };

export const VALUE_GROUPS: InputLocation[] = ['url', 'header', 'body'];

const describeTargets = (targets: InputTarget[], t: Translate) => targets
	.map(({ location, property }) => `${t(`requestPlayground.values.groups.${location}`)} `
		+ (property ?? t('requestPlayground.values.pathSegment')))
	.join(', ');

const groupOf = (targets: InputTarget[]): InputLocation => targets[0]?.location ?? 'body';

// A connector field in the URL (the `{url}` base, mostly) is already shown in the URL bar,
// so the URL group lists only the method references and webhook parameters that need a value.
const listedConnectionFields = (inputs: PlaygroundInputs) => inputs.connectionFields
	.map((connectionField) => ({ ...connectionField,
		targets: connectionField.targets.filter(({ location }) => location !== 'url') }))
	.filter(({ targets }) => targets.length > 0);

export const countValueRows = (inputs: PlaygroundInputs) =>
	inputs.references.length + inputs.webhooks.length + listedConnectionFields(inputs).length;

export function buildValueRows(inputs: PlaygroundInputs, t: Translate): ValueRow[] {
	return [
		...inputs.references.map((reference): ValueRow => ({
			kind: 'input',
			key: referenceInputKey(reference),
			group: groupOf(reference.targets),
			field: formatParsedArgPath(reference.parsed),
			color: reference.parsed.color,
			description: t('requestPlayground.values.fromMethod', {
				method: reference.sourceMethod
					? reference.sourceMethod.label || reference.sourceMethod.name
					: t('requestPlayground.values.unknownMethod'),
				target: describeTargets(reference.targets, t),
			}),
		})),
		...inputs.webhooks.map((webhook): ValueRow => ({
			kind: 'input',
			key: webhookInputKey(webhook),
			group: groupOf(webhook.targets),
			field: `\${${webhook.name}}`,
			description: t('requestPlayground.values.fromWebhook',
				{ type: webhook.type, target: describeTargets(webhook.targets, t) }),
		})),
		...listedConnectionFields(inputs).map(({ field, targets }): ValueRow => ({
			kind: 'connection',
			key: connectionInputKey(field),
			group: groupOf(targets),
			field: `{${field}}`,
			connectionField: field,
			isSecret: isSecretField(field),
			description: t('requestPlayground.values.fromConnection', { target: describeTargets(targets, t) }),
		})),
	];
}
