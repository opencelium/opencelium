import { describe, expect, it } from 'vitest'
import { buildWorkflowLink, readWorkflowFocus, withoutWorkflowFocus } from './workflowLinks'

describe('workflow focus links', () => {
    it('round-trips the element through the URL', () => {
        const link = buildWorkflowLink(42, { index: '0_1', color: '#FFCF00' })
        expect(link).toBe('/workflow/update/42?element=0_1&focusColor=%23FFCF00')
        expect(readWorkflowFocus(link.split('?')[1])).toEqual({ index: '0_1', color: '#FFCF00' })
    })

    it('links without focus and strips only its own params', () => {
        expect(buildWorkflowLink(7)).toBe('/workflow/update/7')
        expect(readWorkflowFocus('?playground=1')).toBeNull()
        expect(withoutWorkflowFocus('?element=0_1&playground=1')).toBe('?playground=1')
        expect(withoutWorkflowFocus('?element=0_1')).toBe('')
    })
})
