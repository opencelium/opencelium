import type { FieldBinding } from './connectionEnhancement.types';
import type { MethodWithId } from './connectionMethod.types';
import type { OperatorWithId } from './connectionOperator.types';
import type { WorkflowConnectionUi } from './connectionUi.types';

export * from './connectionEnhancement.types';
export * from './connectionMethod.types';
export * from './connectionOperator.types';
export * from './connectionUi.types';

export interface Connection {
	connectionId: number;
	name: string;
	description: string;
	fromConnector: ConnectorFlow;
	toConnector: ConnectorFlow | null;
	fieldBindings: FieldBinding[];
	executionPlan?: {
		mode: 'SEQUENTIAL' | 'PARALLEL';
		steps: string[];
		onError: {
			strategy: 'STOP';
			retry: { maxAttempts: number; backOffMs: number };
		};
	};
	ui: WorkflowConnectionUi;
}

export interface ConnectorFlow {
	connectorId: number;
	title: string;
	method: MethodWithId[];
	operator: OperatorWithId[];
}
