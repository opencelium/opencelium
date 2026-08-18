import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../../../../types/connection';
import type { MessageProperty } from '../../shared/messageProperty';
import type { FieldReference } from './ReferenceInfo.types';

const parseIndex = (value?: string) => String(value ?? '').split('_')
	.map(Number).map((part) => Number.isFinite(part) ? part : 0);

const compareIndex = (left?: string, right?: string) => {
	const leftPath = parseIndex(left);
	const rightPath = parseIndex(right);
	const length = Math.max(leftPath.length, rightPath.length);
	for (let index = 0; index < length; index += 1) {
		const difference = (leftPath[index] ?? -1) - (rightPath[index] ?? -1);
		if (difference) return difference;
	}
	return leftPath.length - rightPath.length;
};

const isSamePath = (left: number[], right: number[]) =>
	left.length === right.length && left.every((part, index) => part === right[index]);

const isPathPrefix = (prefix: number[], path: number[]) =>
	prefix.length < path.length && prefix.every((part, index) => part === path[index]);

const isReferenceVisible = (providerIndex?: string, consumerIndex?: string) => {
	if (!providerIndex || !consumerIndex || compareIndex(providerIndex, consumerIndex) >= 0) return false;
	const providerPath = parseIndex(providerIndex);
	const consumerPath = parseIndex(consumerIndex);
	if (isPathPrefix(providerPath, consumerPath)) return true;
	for (let level = consumerPath.length - 1; level >= 0; level -= 1) {
		if (providerPath.length !== level + 1) continue;
		if (!isSamePath(providerPath.slice(0, level), consumerPath.slice(0, level))) continue;
		if ((providerPath[level] ?? -1) < consumerPath[level]) return true;
	}
	return false;
};

export const buildFieldReferences = (connection: Connection, currentMethod: MethodWithId,
	messageProperty: MessageProperty) => {
	const references: Record<string, FieldReference[]> = {};
	connection.fieldBindings.forEach(({ enhancement }) => {
		if (!enhancement) return;
		const resultVar = parseEnhancementArg(enhancement.args.RESULT_VAR);
		if (!resultVar || resultVar.messageProperty !== messageProperty) return;
		if (!resultVar.color || resultVar.color.toLowerCase() !== currentMethod.color.toLowerCase()) return;
		Object.entries(enhancement.args).filter(([key]) => key.startsWith('VAR_')).forEach(([, value]) => {
			const parsed = parseEnhancementArg(value);
			if (!parsed) return;
			const method = connection.fromConnector.method
				.filter((item) => item.color.toLowerCase() === parsed.color.toLowerCase())
				.filter((item) => isReferenceVisible(item.index, currentMethod.index))
				.sort((left, right) => compareIndex(right.index, left.index))[0] ?? null;
			const key = (resultVar.path || '').trim();
			(references[key] ??= []).push({ target: parsed.path, method, color: parsed.color,
				enhanceId: enhancement.enhanceId, sourceMessageProperty: parsed.messageProperty,
				direction: parsed.direction });
		});
	});
	return references;
};

export const formatTargetField = (messageProperty: string, field: string, paramKey: string) => {
	const value = (field || '').trim();
	if (!value) return `${messageProperty}.$.${paramKey}`;
	return value.startsWith('.') ? `${messageProperty}.$${value}` : `${messageProperty}.$.${value}`;
};

export const formatSourceField = (messageProperty: string, field: string) => {
	const value = (field || '').trim();
	return value ? `${messageProperty}.$.${value}` : `${messageProperty}.$`;
};

export const buildReferenceToken = (reference: FieldReference) => {
	if (reference.sourceMessageProperty === 'status') {
		return `${reference.color}.(${reference.direction}).status`;
	}
	const field = reference.target
		? `${reference.sourceMessageProperty}.$.${reference.target}`
		: `${reference.sourceMessageProperty}.$`;
	return `${reference.color}.(${reference.direction}).${field}`;
};
