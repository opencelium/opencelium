import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const dispatch = vi.hoisted(() => vi.fn())
vi.mock('react-redux', () => ({ useDispatch: () => dispatch }))

import type { Connection, MethodWithId } from '../../../../types/connection'
import { requestEditorBridgeStore } from '@features/workflow/command/requestEditorBridge'
import type { useRequestObjectEditor } from '../useRequestObjectEditor'
import { useRequestEditorRegistration } from './useRequestEditorRegistration'

const method = { id: 'b', name: 'ConfigItemUpdate', label: '', color: '#C0FFEE' } as unknown as MethodWithId
const body = { ConfigItem: { Number: '', Vendor: '#FFCFB5.(response).body.$.ConfigItem[0].Vendor' } }

function register(fieldBindings: unknown[] = [], readOnly = false) {
    const selectField = vi.fn()
    const editor = { connection: { fieldBindings } as unknown as Connection, selectField } as unknown as ReturnType<typeof useRequestObjectEditor>
    const view = renderHook(() => useRequestEditorRegistration({ editor, method, messageProperty: 'body', source: body, readOnly }))
    return { selectField, view, open: requestEditorBridgeStore.getState().editor }
}

describe('useRequestEditorRegistration', () => {
    afterEach(() => {
        requestEditorBridgeStore.setState({ editor: null })
        vi.clearAllMocks()
    })

    it('offers the open editor\'s fields while it is mounted', () => {
        const { open, view } = register()
        expect(open?.fieldPaths()).toEqual(['ConfigItem.Number', 'ConfigItem.Vendor'])
        view.unmount()
        expect(requestEditorBridgeStore.getState().editor).toBeNull()
    })

    it('creates the transformation of a referenced field and selects it', () => {
        const { open, selectField } = register()
        const result = open?.openTransformation('ConfigItem.Vendor')
        expect(result).toMatchObject({ kind: 'opened' })
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(selectField).toHaveBeenCalledWith(['ConfigItem'], 'Vendor', body.ConfigItem.Vendor)
    })

    it('reuses a transformation the field already has', () => {
        const existing = { enhancement: { enhanceId: 'e7', args: { RESULT_VAR: '#C0FFEE.(request).body.$.ConfigItem.Vendor' } } }
        const { open } = register([existing])
        const result = open?.openTransformation('ConfigItem.Vendor')
        expect(result).toEqual({ kind: 'opened', enhanceId: 'e7' })
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('refuses a field without a reference, and one it does not have', () => {
        const { open } = register()
        expect(open?.openTransformation('ConfigItem.Number')).toEqual({ kind: 'no-reference' })
        expect(open?.openTransformation('ConfigItem.Price')).toEqual({ kind: 'unknown-field' })
    })

    it('reports the selected field as a path', () => {
        const selectField = vi.fn()
        const editor = { connection: { fieldBindings: [] }, selectField,
            selection: { namespace: ['ConfigItem'], name: 'Vendor', value: '', pathLabel: '' } } as unknown as ReturnType<typeof useRequestObjectEditor>
        renderHook(() => useRequestEditorRegistration({ editor, method, messageProperty: 'body', source: body }))
        expect(requestEditorBridgeStore.getState().editor?.selectedFieldPath()).toBe('ConfigItem.Vendor')
    })

    it('is not offered while read-only', () => {
        expect(register([], true).open).toBeNull()
    })
})
