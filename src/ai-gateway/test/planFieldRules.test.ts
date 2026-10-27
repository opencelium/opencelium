import { describe, expect, it } from 'vitest'
import { parseFieldRuleLine, ruleAppliesTo } from '../src/plan/planFieldRules.ts'

describe('parseFieldRuleLine', () => {
    it('reads several rules and tells scripts from plain values', () => {
        const line = parseFieldRuleLine('ConfigItemCreate, ConfigItemUpdate set ConfigItem.Name = item title; '
            + 'ConfigItem.InciState = script: "Operational" when the status is "in operation", otherwise "Incident", '
            + 'ConfigItem.DeplState = "Production".', ['ConfigItemCreate', 'ConfigItemUpdate'])
        expect(line).toEqual({
            operations: ['ConfigItemCreate', 'ConfigItemUpdate'],
            words: { create: false, update: false },
            rules: [
                { field: 'ConfigItem.Name', value: 'item title', isScript: false },
                { field: 'ConfigItem.InciState', value: 'script: "Operational" when the status is "in operation", otherwise "Incident"', isScript: true },
                { field: 'ConfigItem.DeplState', value: '"Production"', isScript: false },
            ],
        })
    })

    it('keeps commas inside a value and accepts "a script"', () => {
        const line = parseFieldRuleLine('Update sets ConfigItemID = a script: find the item, then take its id.', [])
        expect(line?.rules).toEqual([{ field: 'ConfigItemID', value: 'a script: find the item, then take its id', isScript: true }])
    })

    it('ignores lines that set nothing', () => {
        expect(parseFieldRuleLine('Read the issues with ListIssues.', ['ListIssues'])).toBeUndefined()
    })
})

describe('ruleAppliesTo', () => {
    it('matches named operations, or create/update words when none is named', () => {
        const named = parseFieldRuleLine('TicketCreate sets title = item name', ['TicketCreate'])!
        expect(ruleAppliesTo(named, 'TicketCreate')).toBe(true)
        expect(ruleAppliesTo(named, 'TicketUpdate')).toBe(false)
        const generic = parseFieldRuleLine('Create and update set: title = item name', [])!
        expect(['TicketCreate', 'TicketUpdate', 'TicketSearch'].map((op) => ruleAppliesTo(generic, op))).toEqual([true, true, false])
    })
})
