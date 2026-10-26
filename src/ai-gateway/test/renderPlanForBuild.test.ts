import { describe, expect, it } from 'vitest'
import { parsePlanText, renderPlanForBuild } from '../src/plan/renderPlanForBuild.ts'

const planText = `- Read objects with cmdb.objects.read.
- For each object (loop over the cmdb.objects.read result):
  - Read location with cmdb.category.read.
- Search with ConfigItemSearch.
- If the ConfigItemSearch result exists:
  - For each object (a new loop over the cmdb.objects.read result):
    - If the names do not contain the title: create it with ConfigItemCreate.
- Create sets: Name = title.`

describe('parsePlanText', () => {
    it('reads depth from two-space indentation and strips bullets and numbers', () => {
        expect(parsePlanText(planText).map((step) => step.depth)).toEqual([0, 0, 1, 0, 0, 1, 2, 0])
        expect(parsePlanText('1. Read\n   2.1 Deep')).toEqual([{ text: 'Read', depth: 0 }, { text: 'Deep', depth: 1 }])
    })

    it('never nests a line more than one level below the line above it, and ignores blank lines', () => {
        expect(parsePlanText('      - First\n\n        - Second')).toEqual([{ text: 'First', depth: 0 }, { text: 'Second', depth: 1 }])
    })
})

describe('renderPlanForBuild', () => {
    it('numbers steps hierarchically, labels loops and closes each one explicitly', () => {
        expect(renderPlanForBuild(parsePlanText(planText)).split('\n')).toEqual([
            'Plan (follow it exactly; a step numbered under another runs inside it):',
            '1. Read objects with cmdb.objects.read.',
            '2. Loop A: For each object (loop over the cmdb.objects.read result):',
            '  2.1. Read location with cmdb.category.read.',
            'Loop A ends here.',
            '3. Search with ConfigItemSearch.',
            '4. If the ConfigItemSearch result exists:',
            '  4.1. Loop B: For each object (a new loop over the cmdb.objects.read result):',
            '    4.1.1. If the names do not contain the title: create it with ConfigItemCreate.',
            '  Loop B ends here.',
            '5. Create sets: Name = title.',
        ])
    })

    it('closes a one-line loop right after it', () => {
        expect(renderPlanForBuild(parsePlanText('- For each item: create it with X.\n- Done'))).toContain('Loop A: For each item: create it with X.\nLoop A ends here.\n2. Done')
    })
})
