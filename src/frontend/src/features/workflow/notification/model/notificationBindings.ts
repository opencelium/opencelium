import { createShortId } from '@shared/lib/createId';
import { buildRequestResultField, parseFieldPath } from '../../components/request-editor/body-editor/bodyReference';
import { Language, type Enhancement, type FieldBinding } from '../../types/connection';
import { getActiveDraft } from './notificationConfig';
import { parseBody } from './notificationBody';
import { buildTemplateScript, getTransformationArgs, getTransformationAvailability } from './notificationTransformation';
import {
	listTransformTargets, locateTransformTarget, readTargetValue, transformTargetId,
} from './notificationTransformTargets';
import type { NotificationConfig } from './notification.types';

/** Which transformation (enhanceId) fills which editor target (transformTargetId). */
export type TransformationMap = Record<string, string>;

export const buildTransformationResultVar = (color: string, path: string[]) =>
	`${color}.(request).${buildRequestResultField('body', path.slice(0, -1), path[path.length - 1])}`;

const buildArgs = (resultVar: string, value: string): Record<string, string> => Object.fromEntries([
	['RESULT_VAR', resultVar],
	...getTransformationArgs(value).map((arg, index) => [`VAR_${index}`, arg]),
]);

export const createTransformationEnhancement = (resultVar: string, value: string): Enhancement => ({
	enhanceId: createShortId(),
	language: Language.JavaScript,
	script: buildTemplateScript(value),
	args: buildArgs(resultVar, value),
});

/** Like the body editor (updateRequestFieldBindings): the field's references are the inputs, the script stays. */
export const withTransformationInputs = (enhancement: Enhancement, resultVar: string, value: string): Enhancement =>
	({ ...enhancement, args: buildArgs(resultVar, value) });

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

const resultVarOf = (binding: FieldBinding) => normalize(binding.enhancement?.args?.RESULT_VAR);

const ownBodyPrefix = (color: string) => normalize(`${color}.(request).body.$.`);

/** Reads the targets of the saved config back to the bindings that fill them, matched by RESULT_VAR. */
export const matchTransformations = (
	config: NotificationConfig,
	color: string,
	bindings: readonly FieldBinding[],
): TransformationMap => {
	const draft = getActiveDraft(config);
	if (!config.tool || !draft || draft.jsonOverride !== undefined) return {};
	const toolId = config.tool;
	return Object.fromEntries(listTransformTargets(toolId, draft.message).flatMap((target) => {
		const location = locateTransformTarget(toolId, draft.message, target);
		if (location.kind !== 'whole' || getTransformationAvailability(readTargetValue(draft.message, target)) !== 'ok') return [];
		const resultVar = normalize(buildTransformationResultVar(color, location.path));
		const binding = bindings.find((item) => resultVarOf(item) === resultVar);
		return binding ? [[transformTargetId(toolId, target), binding.enhancement.enhanceId]] : [];
	}));
};

const readBodyValue = (body: unknown, fieldPath: string): unknown => {
	const { namespace, name } = parseFieldPath(fieldPath);
	return [...namespace, name].reduce<unknown>((current, key) =>
		current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, body);
};

type ReconcileArgs = {
	config: NotificationConfig;
	color: string;
	bindings: readonly FieldBinding[];
	transformations: TransformationMap;
};

/**
 * The step's body bindings as they must be saved with `config`. In the editor every binding follows
 * its target to wherever the target sits now (a Slack header shifts the body block), takes the
 * target's references as inputs, and goes when its target did. Hand-edited JSON has no targets, so
 * there a binding stays only while its value still holds a step reference to replace.
 */
export const reconcileTransformationBindings = ({ config, color, bindings, transformations }: ReconcileArgs): FieldBinding[] => {
	const prefix = ownBodyPrefix(color);
	const isOwn = (binding: FieldBinding) => resultVarOf(binding).startsWith(prefix);
	// Rewritten in place, so an untouched dialog hands back the bindings exactly as it got them.
	const keepOwn = (next: (binding: FieldBinding) => FieldBinding | null) => bindings.flatMap((binding) => {
		if (!isOwn(binding)) return [binding];
		const kept = next(binding);
		return kept ? [kept] : [];
	});
	const draft = getActiveDraft(config);
	if (!config.tool || !draft) return keepOwn(() => null);

	if (draft.jsonOverride !== undefined) {
		const parsed = parseBody(draft.jsonOverride);
		if (!parsed.ok) return [...bindings];
		return keepOwn((binding) => {
			// Sliced from the original spelling: the path's keys are case-sensitive.
			const resultVar = String(binding.enhancement.args.RESULT_VAR).trim();
			const value = readBodyValue(parsed.value, resultVar.slice(prefix.length));
			return typeof value === 'string' && getTransformationAvailability(value) === 'ok' ? binding : null;
		});
	}

	const toolId = config.tool;
	const filled = new Map(listTransformTargets(toolId, draft.message).flatMap((target): [string, FieldBinding['enhancement']][] => {
		const enhanceId = transformations[transformTargetId(toolId, target)];
		const binding = bindings.find((item) => isOwn(item) && item.enhancement.enhanceId === enhanceId);
		const value = readTargetValue(draft.message, target);
		const location = locateTransformTarget(toolId, draft.message, target);
		if (!enhanceId || !binding || location.kind !== 'whole' || getTransformationAvailability(value) !== 'ok') return [];
		const resultVar = buildTransformationResultVar(color, location.path);
		return [[enhanceId, withTransformationInputs(binding.enhancement, resultVar, value)]];
	}));
	return keepOwn((binding) => {
		const enhancement = filled.get(binding.enhancement.enhanceId);
		return enhancement ? { ...binding, enhancement } : null;
	});
};
