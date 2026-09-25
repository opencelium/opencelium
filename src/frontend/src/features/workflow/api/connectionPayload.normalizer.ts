import { normalizeWorkflowFieldBindings } from './connectionPayload.fieldBindings';

const normalizeIndex = (value: unknown, fallback: number) =>
	typeof value === 'string' ? value : String(value ?? fallback);

const stripPluralConnectorLists = (connector: any) => {
	if (!connector) return connector;
	const { methods, operators, ...rest } = connector;
	return rest;
};

export const normalizeConnectionPayload = (payload: any) => {
	const fromConnector = stripPluralConnectorLists(payload?.fromConnector);
	const sourceMethods = Array.isArray(payload?.fromConnector?.methods)
		? payload.fromConnector.methods
		: Array.isArray(fromConnector?.method) ? fromConnector.method : [];
	const sourceOperators = Array.isArray(payload?.fromConnector?.operators)
		? payload.fromConnector.operators
		: Array.isArray(fromConnector?.operator) ? fromConnector.operator : [];
	const rootOffset = sourceMethods.length + sourceOperators.length;
	const shiftRootIndex = (value: unknown, fallback: number) => {
		const parts = normalizeIndex(value, fallback).split('_');
		parts[0] = String((Number(parts[0]) || 0) + rootOffset);
		return parts.join('_');
	};
	const toMethods = Array.isArray(payload?.toConnector?.methods)
		? payload.toConnector.methods : [];
	const toOperators = Array.isArray(payload?.toConnector?.operators)
		? payload.toConnector.operators : [];
	const fromInvokerName = payload?.fromConnector?.invoker?.name ?? fromConnector?.invoker?.name;
	const toInvokerName = payload?.toConnector?.invoker?.name;
	const combinedMethods = [
		...sourceMethods.map((method: any, index: number) => ({
			...method,
			index: normalizeIndex(method?.index, index),
			fallbackInvokerName: fromInvokerName,
		})),
		...toMethods.map((method: any, index: number) => ({
			...method,
			index: shiftRootIndex(method?.index, sourceMethods.length + index),
			fallbackInvokerName: toInvokerName,
		})),
	];
	const combinedOperators = [
		...sourceOperators.map((operator: any, index: number) => ({
			...operator, index: normalizeIndex(operator?.index, index),
		})),
		...toOperators.map((operator: any, index: number) => ({
			...operator,
			index: shiftRootIndex(operator?.index, sourceOperators.length + index),
		})),
	];

	return {
		...payload,
		title: payload?.title ?? payload?.name ?? 'Workflow Connection',
		name: payload?.name ?? payload?.title ?? 'Workflow Connection',
		fieldBinding: normalizeWorkflowFieldBindings(payload?.fieldBinding),
		fieldBindings: normalizeWorkflowFieldBindings(payload?.fieldBindings),
		fromConnector: {
			...fromConnector,
			connectorId: -1,
			title: 'DEFAULT',
			method: combinedMethods.map((method: any) => {
				const rawInvoker = method?.connector?.invoker;
				const connectorInvokerName = typeof rawInvoker === 'string'
					? rawInvoker : rawInvoker?.name;
				return {
					...method,
					connector: method?.connector === null ? null : {
						connectorId: method?.connector?.connectorId ?? method?.connectorId ?? -1,
						title: method?.connector?.title ?? method?.connectorTitle
							?? method?.connector?.name ?? 'DEFAULT',
						icon: method?.connector?.icon ?? null,
						invokerName: connectorInvokerName ?? method?.invokerName
							?? method?.connector?.invokerName ?? method?.fallbackInvokerName ?? null,
					},
				};
			}),
			operator: combinedOperators.map((operator: any) => ({ ...operator })),
		},
		toConnector: null,
	};
};
