import { DEFAULT_ENHANCEMENT_SCRIPT } from '../components/request-editor/body-editor/bodyReference';
import { describeBinding, logFieldBinding } from '../utils/fieldBindingDebug';

const parseBindingReference = (reference: unknown) => {
	const match = String(reference ?? '')
		.trim()
		.replace(/^\{%\s*/, '')
		.replace(/\s*%}$/, '')
		.match(/^(#[A-Fa-f0-9]{6})\.\((request|response)\)\.(.+)$/);
	if (!match) return undefined;
	return { color: match[1], type: match[2], field: match[3] };
};

const serializeFieldBinding = (binding: any) => {
	const args = binding?.enhancement?.args;
	if (!args?.RESULT_VAR) return binding;
	const to = parseBindingReference(args.RESULT_VAR);
	const from = Object.keys(args)
		.filter((key) => /^VAR_\d+$/.test(key))
		.sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)))
		.map((key) => parseBindingReference(args[key]))
		.filter(Boolean);
	if (!to || from.length === 0) return binding;

	const expertVar = [
		`//var RESULT_VAR = ${args.RESULT_VAR};`,
		...from.map((item: any, index) =>
			`//var VAR_${index} = ${item.color}.(${item.type}).${item.field};`),
	].join('\n');
	return {
		...(binding?.id ? { id: binding.id } : {}),
		from,
		to: [to],
		enhancement: {
			...(Number.isInteger(Number(binding?.enhancement?.enhanceId))
				? { enhancementId: Number(binding.enhancement.enhanceId) }
				: {}),
			name: binding?.enhancement?.name ?? '',
			description: binding?.enhancement?.description ?? '',
			language: binding?.enhancement?.language ?? 'js',
			simpleCode: binding?.enhancement?.simpleCode ?? null,
			expertVar,
			expertCode: binding?.enhancement?.script?.endsWith(';')
				? binding.enhancement.script
				: `${binding?.enhancement?.script ?? DEFAULT_ENHANCEMENT_SCRIPT};`,
		},
	};
};

export const serializeWorkflowFieldBindings = (fieldBindings: any) =>
	Array.isArray(fieldBindings)
		? fieldBindings
			.filter((binding) => {
				const result = parseBindingReference(binding?.enhancement?.args?.RESULT_VAR);
				return result?.type !== 'request' || result.field !== 'endpoint';
			})
			.map(serializeFieldBinding)
		: fieldBindings;

const buildBindingReference = (reference: any) => {
	if (!reference?.color || !reference?.type || !reference?.field) return undefined;
	return `${reference.color}.(${reference.type}).${reference.field}`;
};

const stableBindingId = (value: string) => {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return `enh_${hash.toString(16)}`;
};

const normalizeFieldBinding = (binding: any) => {
	const enhancement = binding?.enhancement;
	logFieldBinding('1. loaded from the server', describeBinding(binding));
	if (!enhancement) return binding;
	// Already carrying the editors' own shape — but "has enhanceId and args" does
	// not mean "has a script": a binding can arrive with those and still keep its
	// code under the backend's `expertCode`, and every editor reads `script`. That
	// is how a saved script opened blank in the field-binding drawer.
	if (enhancement.enhanceId && enhancement.args) {
		return {
			...binding,
			enhancement: {
				...enhancement,
				enhanceId: String(enhancement.enhanceId),
				script: enhancement.script ?? enhancement.expertCode
					?? `${DEFAULT_ENHANCEMENT_SCRIPT};`,
			},
		};
	}

	const to = Array.isArray(binding?.to) ? binding.to[0] : undefined;
	const from: any[] = Array.isArray(binding?.from) ? binding.from : [];
	const resultVar = buildBindingReference(to);
	const fromArgs = from.reduce<Record<string, string>>((args, item, index) => {
		const value = buildBindingReference(item);
		if (typeof value === 'string') args[`VAR_${index}`] = value;
		return args;
	}, {});
	return {
		...binding,
		enhancement: {
			...enhancement,
			enhanceId: String(enhancement.enhancementId ?? enhancement.enhanceId
				?? binding.id ?? stableBindingId(resultVar ?? JSON.stringify(binding))),
			script: enhancement.script ?? enhancement.expertCode ?? `${DEFAULT_ENHANCEMENT_SCRIPT};`,
			args: resultVar ? { RESULT_VAR: resultVar, ...fromArgs } : enhancement.args ?? {},
		},
	};
};

export const normalizeWorkflowFieldBindings = (fieldBindings: any) => {
	if (!Array.isArray(fieldBindings)) return [];
	const normalized = fieldBindings.map(normalizeFieldBinding);
	normalized.forEach((binding) =>
		logFieldBinding('2. after normalization', describeBinding(binding)));
	return normalized;
};
