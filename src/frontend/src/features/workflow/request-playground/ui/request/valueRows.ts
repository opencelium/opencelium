import type { Connector } from '@entities/connector/model/types';
import { findMethodByColor } from '../../../components/request-editor/body-editor/requestReferenceOptions';
import { formatParsedArgPath, parseEnhancementArg } from '../../../components/request-editor/utils/parseEnhancementArg';
import type { MethodWithId } from '../../../types/connection';
import type { InputLocation, InputTarget, PlaygroundInputs } from '../../model/collectPlaygroundInputs';
import { connectorReferenceKey, inputKeyOfStaticReference, locateReference } from '../../model/methodTestRefs';
import type { MethodTestRefs, PlaygroundDraft } from '../../model/playground.types';
import { isSecretField } from '../../model/playgroundConnection';
import { referenceInputKey, webhookInputKey } from '../../model/playgroundValues';

type Translate = (key: string, options?: Record<string, unknown>) => string;

// `field` is what needs a value (the reference's field path, the webhook parameter, the
// connector reference); `description` names its source and where the value lands in the request.
type RowBase = { key: string; group: InputLocation; field: string; description: string };

export type ValueRow =
	| RowBase & { kind: 'input'; color?: string }
	| RowBase & { kind: 'connection'; reference: string; connectorId: number; connectorField: string;
		isAvailable: boolean; isSecret: boolean };

export const VALUE_GROUPS: InputLocation[] = ['url', 'header', 'body'];

type BuildArgs = {
	inputs: PlaygroundInputs;
	// Undefined until /refs answers: the editor's own scan is shown meanwhile.
	refs: MethodTestRefs | undefined;
	draft: PlaygroundDraft;
	connectors: readonly Connector[];
	methods: MethodWithId[];
};

const describeTargets = (targets: InputTarget[], t: Translate) => targets
	.map(({ location, property }) => `${t(`requestPlayground.values.groups.${location}`)} `
		+ (property ?? t('requestPlayground.values.pathSegment')))
	.join(', ');

const methodLabel = (method: MethodWithId | undefined, t: Translate) =>
	method ? method.label || method.name : t('requestPlayground.values.unknownMethod');

const groupOf = (targets: InputTarget[]): InputLocation => targets[0]?.location ?? 'body';

function buildScannedRows({ inputs }: BuildArgs, t: Translate): ValueRow[] {
	return [
		...inputs.references.map((reference): ValueRow => ({
			kind: 'input',
			key: referenceInputKey(reference),
			group: groupOf(reference.targets),
			field: formatParsedArgPath(reference.parsed),
			color: reference.parsed.color,
			description: t('requestPlayground.values.fromMethod', {
				method: methodLabel(reference.sourceMethod, t),
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
	];
}

// /refs decides which values the test needs; the editor's scan only enriches the rows it knows.
export function buildValueRows(args: BuildArgs, t: Translate): ValueRow[] {
	const scanned = buildScannedRows(args, t);
	const { refs, draft, connectors, methods } = args;
	if (!refs) return scanned;

	const staticKeys = new Set(refs.staticReferences.map(({ reference }) => inputKeyOfStaticReference(reference)));
	const known = scanned.filter(({ key }) => staticKeys.has(key));
	const seen = new Set(known.map(({ key }) => key));
	const extra = refs.staticReferences.flatMap(({ reference, type }): ValueRow[] => {
		const key = inputKeyOfStaticReference(reference);
		if (seen.has(key)) return [];
		seen.add(key);
		const group = locateReference(draft, reference);
		const parsed = parseEnhancementArg(key);
		return [parsed
			? { kind: 'input', key, group, field: formatParsedArgPath(parsed), color: parsed.color,
				description: t('requestPlayground.values.fromMethod', {
					method: methodLabel(findMethodByColor(methods, parsed.color), t),
					target: t(`requestPlayground.values.groups.${group}`),
				}) }
			: { kind: 'input', key, group, field: reference,
				description: t(`requestPlayground.values.staticType.${type ?? 'unknown'}`) }];
	});
	const connection = refs.connectorReferences.map(({ reference, connectorId, key, available }): ValueRow => {
		const connector = connectors.find((item) => item.connectorId === connectorId)?.title ?? `#${connectorId}`;
		return {
			kind: 'connection', key: connectorReferenceKey(reference), group: locateReference(draft, reference),
			field: reference, reference, connectorId, connectorField: key, isAvailable: available,
			isSecret: isSecretField(key),
			description: available
				? t('requestPlayground.values.fromConnector', { connector })
				: t('requestPlayground.values.connectorFieldMissing', { connector, field: key }),
		};
	});
	return [...known, ...extra, ...connection];
}
