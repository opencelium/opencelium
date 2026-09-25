import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MethodProvider } from '../../../providers/MethodContext';
import { createLegacyStore } from '../../../store';
import type { Connection, MethodResponse, MethodWithId, PayloadData, UI } from '../../../types/connection';
import { MethodType, PayloadDataType, PayloadFormat, PayloadType } from '../../../types/connection';
import { useRequestObjectEditor } from './useRequestObjectEditor';

const emptyPayloadData = (): PayloadData => ({
	type: PayloadType.Object,
	format: PayloadFormat.Json,
	data: PayloadDataType.Raw,
	fields: {},
});

const emptyMethodResponse = (): MethodResponse => ({
	status: '',
	header: {},
	body: emptyPayloadData(),
});

export const emptyUI: UI = { flowcharts: [], flowchartEdges: [], operators: [] };

export const method = (overrides: Partial<MethodWithId>): MethodWithId => ({
	index: '1',
	name: 'Method',
	color: '#AABBCC',
	methodType: MethodType.HttpRequest,
	request: {
		requestId: 'r1', endpoint: '', method: 'GET', header: {}, body: emptyPayloadData(),
	},
	response: {
		responseId: 'resp1', success: emptyMethodResponse(), fail: emptyMethodResponse(),
	},
	id: 'm1',
	connector: null,
	...overrides,
});

type UpdatePayload = {
	methodId: string;
	newFields: Record<string, unknown>;
	messageProperty: 'body' | 'header';
};

export const setupEditor = (
	connection: Connection,
	consumerMethod: MethodWithId,
	source: Record<string, unknown>,
) => {
	const store = createLegacyStore();
	store.dispatch({ type: 'connection/setInitialConnection', payload: connection.connectionId });
	store.dispatch({ type: 'connection/updateConnection', payload: connection });
	let dispatchedPayload: UpdatePayload | null = null;
	const originalDispatch = store.dispatch;
	store.dispatch = ((action: { type: string; payload?: unknown }) => {
		if (action.type === 'connection/updatePayload') {
			dispatchedPayload = action.payload as UpdatePayload;
		}
		return originalDispatch(action);
	}) as typeof store.dispatch;
	const { result } = renderHook(
		() => useRequestObjectEditor({ messageProperty: 'body', source }),
		{ wrapper: ({ children }: { children: ReactNode }) => (
			<Provider store={store}>
				<MethodProvider value={{ method: consumerMethod }}>{children}</MethodProvider>
			</Provider>
		) },
	);
	return { result, getDispatchedPayload: () => dispatchedPayload };
};
