import type { Connector } from '@entities/connector/model/types';

// Credentials are never shown in clear text; the backend fills them in from the connector.
const SECRET_FIELD_RE = /pass|secret|token|key|credential/i;

export const SECRET_MASK = '••••••••';

export const isSecretField = (field: string) => SECRET_FIELD_RE.test(field);

export const connectorsOfInvoker = (connectors: readonly Connector[], invokerName: string | null | undefined) => {
	const name = invokerName?.toLowerCase();
	return name ? connectors.filter((connector) => connector.invoker?.name?.toLowerCase() === name) : [];
};

export const readConnectionFieldNames = (connector: Connector | undefined) => Array.from(new Set([
	...Object.keys(connector?.invoker?.requiredData ?? {}),
	...Object.keys(connector?.requestData ?? {}),
]));

export const readConnectionFieldValue = (connector: Connector | undefined, field: string,
	overrides: Record<string, string>) => overrides[field] ?? connector?.requestData?.[field] ?? '';
