import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useRequestObjectEditor } from './useRequestObjectEditor';
import { MethodProvider } from '../../../providers/MethodContext';
import { createLegacyStore } from '../../../store';
import { buildRequestResultField, buildBodyEnhancement, parseReference } from '../body-editor/bodyReference';
import { buildReferenceValue } from '../body-editor/requestReferenceOptions';
import {
  MethodType,
  PayloadDataType,
  PayloadFormat,
  PayloadType,
  type Connection,
  type MethodResponse,
  type MethodWithId,
  type PayloadData,
  type UI,
} from '../../../types/connection';

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

const emptyUI: UI = { flowcharts: [], flowchartEdges: [], operators: [] };

const method = (overrides: Partial<MethodWithId>): MethodWithId => ({
  index: '1',
  name: 'Method',
  color: '#AABBCC',
  methodType: MethodType.HttpRequest,
  request: { requestId: 'r1', endpoint: '', method: 'GET', header: {}, body: emptyPayloadData() },
  response: { responseId: 'resp1', success: emptyMethodResponse(), fail: emptyMethodResponse() },
  id: 'm1',
  connector: null,
  ...overrides,
});

type UpdatePayloadPayload = { methodId: string; newFields: Record<string, unknown>; messageProperty: 'body' | 'header' };

function setupEditor(connection: Connection, consumerMethod: MethodWithId, source: Record<string, unknown>) {
  const store = createLegacyStore();
  store.dispatch({ type: 'connection/setInitialConnection', payload: connection.connectionId });
  store.dispatch({ type: 'connection/updateConnection', payload: connection });

  let dispatchedPayload: UpdatePayloadPayload | null = null;
  const originalDispatch = store.dispatch;
  store.dispatch = ((action: { type: string; payload?: unknown }) => {
    if (action.type === 'connection/updatePayload') dispatchedPayload = action.payload as UpdatePayloadPayload;
    return originalDispatch(action);
  }) as typeof store.dispatch;

  const { result } = renderHook(() => useRequestObjectEditor({ messageProperty: 'body', source }), {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <MethodProvider value={{ method: consumerMethod }}>{children}</MethodProvider>
      </Provider>
    ),
  });

  return { result, getDispatchedPayload: () => dispatchedPayload };
}

describe('deleteReferenceAtPath', () => {
  it('clears the field when it holds a single reference', () => {
    const providerMethod = method({ index: '1', name: 'Provider', color: '#AABBCC' });
    const consumerMethod = method({ index: '2', name: 'Consumer', color: '#DDEEFF', id: 'm2' });
    const referenceToken = buildReferenceValue(providerMethod.color, 'body', 'someKey');
    const resultVar = `${consumerMethod.color}.(request).${buildRequestResultField('body', [], 'myField')}`;
    const enhancement = buildBodyEnhancement('enh-1', resultVar, [parseReference(referenceToken)!]);
    const connection: Connection = {
      connectionId: 1,
      name: 'c',
      description: '',
      fromConnector: { connectorId: 1, title: 'From', method: [providerMethod, consumerMethod], operator: [] },
      toConnector: null,
      fieldBindings: [{ enhancement }],
      ui: emptyUI,
    };

    const { result, getDispatchedPayload } = setupEditor(connection, consumerMethod, { myField: referenceToken });

    act(() => {
      result.current.deleteReferenceAtPath('myField', referenceToken);
    });

    expect(getDispatchedPayload()).not.toBeNull();
    expect(getDispatchedPayload()!.newFields).toEqual({ myField: '' });
  });

  it('removes only the targeted reference when the field has multiple references', () => {
    const providerMethod = method({ index: '1', name: 'Provider', color: '#AABBCC' });
    const otherProviderMethod = method({ index: '1', name: 'Other', color: '#112233', id: 'm3' });
    const consumerMethod = method({ index: '2', name: 'Consumer', color: '#DDEEFF', id: 'm2' });
    const tokenA = buildReferenceValue(providerMethod.color, 'body', 'someKey');
    const tokenB = buildReferenceValue(otherProviderMethod.color, 'header', 'otherKey');
    const resultVar = `${consumerMethod.color}.(request).${buildRequestResultField('body', [], 'myField')}`;
    const enhancement = buildBodyEnhancement('enh-1', resultVar, [parseReference(tokenA)!, parseReference(tokenB)!]);
    const connection: Connection = {
      connectionId: 1,
      name: 'c',
      description: '',
      fromConnector: {
        connectorId: 1,
        title: 'From',
        method: [providerMethod, otherProviderMethod, consumerMethod],
        operator: [],
      },
      toConnector: null,
      fieldBindings: [{ enhancement }],
      ui: emptyUI,
    };

    const { result, getDispatchedPayload } = setupEditor(connection, consumerMethod, {
      myField: `${tokenA};${tokenB}`,
    });

    act(() => {
      result.current.deleteReferenceAtPath('myField', tokenA);
    });

    expect(getDispatchedPayload()).not.toBeNull();
    expect(getDispatchedPayload()!.newFields).toEqual({ myField: tokenB });
  });

  // Regression for a JSON key that itself contains a literal dot (OData's "@odata.id"
  // convention): naive dot-splitting misread it as two nested segments ("@odata" / "id"), so
  // the lookup missed source["@odata.id"] entirely and the delete silently no-op'd.
  it('removes the reference from a field whose own name contains a literal dot (@odata.id)', () => {
    const providerMethod = method({ index: '1', name: 'Provider', color: '#AABBCC' });
    const consumerMethod = method({ index: '2', name: 'Consumer', color: '#DDEEFF', id: 'm2' });
    const referenceToken = buildReferenceValue(providerMethod.color, 'body', 'someKey');
    const resultVar = `${consumerMethod.color}.(request).${buildRequestResultField('body', [], '@odata.id')}`;
    const enhancement = buildBodyEnhancement('enh-1', resultVar, [parseReference(referenceToken)!]);
    const connection: Connection = {
      connectionId: 1,
      name: 'c',
      description: '',
      fromConnector: { connectorId: 1, title: 'From', method: [providerMethod, consumerMethod], operator: [] },
      toConnector: null,
      fieldBindings: [{ enhancement }],
      ui: emptyUI,
    };

    // The actual JSON body: "@odata.id" is one key, not a nested { "@odata": { "id": ... } }.
    const { result, getDispatchedPayload } = setupEditor(connection, consumerMethod, {
      '@odata.id': referenceToken,
    });

    act(() => {
      result.current.deleteReferenceAtPath('@odata.id', referenceToken);
    });

    expect(getDispatchedPayload()).not.toBeNull();
    expect(getDispatchedPayload()!.newFields).toEqual({ '@odata.id': '' });
  });
});
