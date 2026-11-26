import { DEFAULT_ENHANCEMENT_SCRIPT } from '../../components/request-editor/body-editor/bodyReference';
import { ANY_REFERENCE_TOKEN_RE } from './notificationBody';

const STEP_TOKEN_RE = /^\{%\s*(#[0-9a-fA-F]{6}\.\((?:request|response)\)[^%]*?)\s*%\}$/;
const GLOBAL_TOKEN_RE = /^\{\{\s*global\.[^}]+\}\}$/;

export type TransformationPart =
	| { kind: 'text'; text: string }
	| { kind: 'step'; token: string; arg: string }
	| { kind: 'global'; token: string; arg: string }
	| { kind: 'webhook'; token: string };

const toTokenPart = (token: string): TransformationPart => {
	const step = STEP_TOKEN_RE.exec(token);
	if (step) return { kind: 'step', token, arg: step[1] };
	if (GLOBAL_TOKEN_RE.test(token)) return { kind: 'global', token, arg: token.trim() };
	return { kind: 'webhook', token };
};

/** The value as text and reference tokens; trimmed like the tools trim it before it is sent. */
export const splitTransformationParts = (value: string): TransformationPart[] => {
	const text = value.trim();
	const parts: TransformationPart[] = [];
	let lastIndex = 0;
	for (const match of text.matchAll(new RegExp(ANY_REFERENCE_TOKEN_RE.source, 'g'))) {
		if (match.index > lastIndex) parts.push({ kind: 'text', text: text.slice(lastIndex, match.index) });
		parts.push(toTokenPart(match[0]));
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) parts.push({ kind: 'text', text: text.slice(lastIndex) });
	return parts;
};

type ArgPart = Extract<TransformationPart, { arg: string }>;

const isArgPart = (part: TransformationPart): part is ArgPart => part.kind === 'step' || part.kind === 'global';

/** The script's inputs, in order of first use: `VAR_0` is the first distinct reference. */
export const getTransformationArgs = (value: string): string[] =>
	[...new Set(splitTransformationParts(value).filter(isArgPart).map((part) => part.arg))];

export type TransformationAvailability = 'ok' | 'noStepReference' | 'webhookParameter';

/**
 * The backend reads a script's inputs from step references (a global only rides along, see
 * getBindingArguments), and has no way to hand it a webhook parameter.
 */
export const getTransformationAvailability = (value: string): TransformationAvailability => {
	const parts = splitTransformationParts(value);
	if (parts.some((part) => part.kind === 'webhook')) return 'webhookParameter';
	return parts.some((part) => part.kind === 'step') ? 'ok' : 'noStepReference';
};

/** A transformed value keeps only the script's inputs: the script result replaces the whole value. */
export const toTransformedValue = (value: string): string =>
	splitTransformationParts(value).filter(isArgPart).map((part) => part.token).join(' ');

/**
 * A first script that reproduces what the field said, so turning a field into a transformation
 * never loses its text: "Order {%a%} is {%b%}" becomes `RESULT_VAR = "Order " + VAR_0 + " is " + VAR_1`.
 */
export const buildTemplateScript = (value: string): string => {
	const args = getTransformationArgs(value);
	const pieces = splitTransformationParts(value).flatMap((part) => {
		if (part.kind === 'text') return [JSON.stringify(part.text)];
		return isArgPart(part) ? [`VAR_${args.indexOf(part.arg)}`] : [];
	});
	if (pieces.length === 1 && pieces[0] === 'VAR_0') return DEFAULT_ENHANCEMENT_SCRIPT;
	return `RESULT_VAR = ${pieces.join(' + ')}`;
};
