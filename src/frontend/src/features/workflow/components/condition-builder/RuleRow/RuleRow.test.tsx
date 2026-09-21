import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Provider-free stand-ins; none of them takes part in the row's own identity.
vi.mock('@shared/ui/primitives/Tooltip', () => ({ Tooltip: () => null }))
vi.mock('@shared/ui/actions/DeleteIconButton', () => ({ DeleteIconButton: () => null }))
vi.mock('../ConditionValueInput/ConditionValueInput', () => ({ ConditionValueInput: () => null }))

import { RuleRow } from './RuleRow'
import type { RuleRowProps } from './RuleRow.types'

const renderRow = (operatorType: 'if' | 'loop') => {
    const props = {
        rule: { id: 'rule-1', type: 'rule' },
        operatorType,
        methods: [],
        allMethods: [],
        iterators: [],
        canDelete: false,
        onChange: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
    } as unknown as RuleRowProps
    return render(<RuleRow {...props} />)
}

describe('RuleRow', () => {
    // The workflow tutorial highlights this row once it exists, instead of the button
    // that created it. Without the id the highlight silently stays on the button.
    it.each(['if', 'loop'] as const)('identifies itself as a condition row (%s)', kind => {
        const view = renderRow(kind)
        expect(view.container.querySelector('[data-testid="workflow-condition-rule"]')).not.toBeNull()
    })
})
