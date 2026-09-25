import type { Connector } from '@entities/connector/model/types';

export type GraphQlBodyEditorStatus =
	| 'idle' | 'fetching-connector' | 'logging-in' | 'ready' | 'error';

export type GraphQlBodyEditorError =
	| 'connectorFailed' | 'loginFailed' | 'masterPasswordNotConfigured' | null;

export type GraphQlLogin = (connector: Connector) => Promise<string>;
