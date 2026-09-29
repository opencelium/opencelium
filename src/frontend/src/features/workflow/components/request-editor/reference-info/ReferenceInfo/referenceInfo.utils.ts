import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../../../../types/connection';
import { pickNearestVisibleProvider } from '../../../../utils/graph.referenceProvider';
import type { MessageProperty } from '../../shared/messageProperty';
import type { FieldReference } from './ReferenceInfo.types';

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
			const method = pickNearestVisibleProvider(
				connection.fromConnector.method.filter((item) =>
					item.color.toLowerCase() === parsed.color.toLowerCase()),
				(item) => item.index,
				currentMethod.index,
			);
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
