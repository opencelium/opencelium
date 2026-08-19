import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { buildRequestResultField, buildBodyEnhancement, parseReference } from '../body-editor/bodyReference';
import { buildReferenceValue } from '../body-editor/requestReferenceOptions';
import type { Connection } from '../../../types/connection';
import { emptyUI, method, setupEditor } from './useRequestObjectEditor.testUtils';

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
