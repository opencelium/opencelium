import type { MethodWithId } from '../../../types/connection';
import type { ResponseType } from '../../request-editor/body-editor/requestReferenceOptions';
import type { ConditionValueSource } from '../conditionBuilder.types';

const unwrapConditionReference = (value?: string) => value?.trim()
	.replace(/^\{%\s*/, '')
	.replace(/\s*%}$/, '');

export const parseMethodFromReference = (methods: MethodWithId[], value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	const color = reference.match(/^#?([A-Fa-f0-9]{6})\.\(response\)\./)?.[1];
	return color ? methods.find((method) =>
		method.color.replace('#', '').toLowerCase() === color.toLowerCase()) : undefined;
};

export const parseResponseTypeFromReference = (value?: string): ResponseType | undefined => {
	const reference = unwrapConditionReference(value);
	if (reference?.includes('.header.')) return 'header';
	if (reference?.includes('.status')) return 'status';
	if (reference?.includes('.body.')) return 'body';
	return undefined;
};

export const parsePathFromReference = (value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	if (reference === '$' || reference === '$.') return '$';
	if (reference.includes('(response).status')) return 'status';
	const match = reference.match(/\.(body|header)(?:\.\$\.?|\.)?(.*)$/);
	if (match && match[2] === '') return '$';
	return (match?.[2] || reference)
		.replace(/^#?[A-Fa-f0-9]{6}\.\(response\)\.(body|header)\.\$\.?/, '');
};

export const getSourceFromField = (field?: string): ConditionValueSource => {
	const reference = unwrapConditionReference(field);
	if (!reference) return 'direct';
	if (reference.startsWith('${') && reference.endsWith('}')) return 'webhook';
	if (/^#?[A-Fa-f0-9]{6}\.\(response\)\./.test(reference)) return 'direct';
	return 'constant';
};
