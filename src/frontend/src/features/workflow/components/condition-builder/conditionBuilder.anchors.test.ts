import { describe, expect, it } from 'vitest'
import source from './ConditionBuilder.tsx?raw'

/**
 * A source check, deliberately. ConditionBuilder declares its own local `RuleRow` and
 * `GroupEditor` — the extracted `RuleRow/` and `GroupEditor/` folders are imported by
 * nothing outside themselves — so the components the app renders are not reachable to
 * mount on their own, and this file is over 900 lines of redux- and context-bound UI.
 *
 * It exists because the workflow tutorial aims its spotlight at these ids, and the
 * cost of them going missing is silent: the highlight simply stops moving, with
 * nothing failing anywhere. It caught exactly that once already, when the rule row's
 * id was added to the extracted copy that never renders.
 */
const ANCHORS = [
    'workflow-condition-builder',
    'workflow-condition-add-condition',
    'workflow-condition-rule',
    'workflow-condition-save',
]

describe('condition builder tutorial anchors', () => {
    it.each(ANCHORS)('the rendered builder still emits %s', anchor => {
        expect(source).toContain(`data-testid="${anchor}"`)
    })

    it('keeps the comparison row addressable in the copy that actually renders', () => {
        // The row the app shows is the one declared in this file, not RuleRow/RuleRow.
        const rowMarkup = source.slice(source.indexOf('className={`conditionRule'))
        expect(rowMarkup.slice(0, 200)).toContain('workflow-condition-rule')
    })
})
