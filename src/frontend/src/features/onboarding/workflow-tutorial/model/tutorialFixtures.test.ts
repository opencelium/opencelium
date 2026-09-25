import { describe, expect, it } from 'vitest'
import { TUTORIAL_CONNECTORS, TUTORIAL_CONNECTORS_META, TUTORIAL_INVOKERS } from '@features/onboarding/workflow-tutorial/model/tutorialFixtures'

describe('workflow tutorial fixtures', () => {
    it('lists the same connectors in both shapes', () => {
        expect(TUTORIAL_CONNECTORS_META.map(c => c.title)).toEqual(TUTORIAL_CONNECTORS.map(c => c.title))
        expect(TUTORIAL_CONNECTORS_META.map(c => c.invoker.name)).toEqual(TUTORIAL_CONNECTORS.map(c => c.invoker.name))
    })

    it('names an invoker that the invoker list actually contains', () => {
        const known = new Set(TUTORIAL_INVOKERS.map(i => i.name))
        for (const connector of TUTORIAL_CONNECTORS) expect(known).toContain(connector.invoker.name)
    })

    it('gives every connector at least one method to place', () => {
        for (const connector of TUTORIAL_CONNECTORS) {
            expect(connector.invoker.operations.length).toBeGreaterThan(0)
        }
    })

    it('carries the fields the scenario references, per iteration', () => {
        const [crm] = TUTORIAL_CONNECTORS
        const list = crm.invoker.operations.find(o => o.name === 'getCustomers')
        const listed = list?.response.success.body.fields.customers?.[0] ?? {}
        // email feeds the lookup's endpoint; the two names are joined into one field,
        // which is what forces an enhancement rather than a plain reference.
        expect(Object.keys(listed)).toEqual(
            expect.arrayContaining(['email', 'firstName', 'lastName']))
    })

    it('lets the lookup take the email in its endpoint rather than a body', () => {
        const [, support] = TUTORIAL_CONNECTORS
        const lookup = support.invoker.operations.find(o => o.name === 'getClientByEmail')
        expect(lookup?.request.method).toBe('GET')
        expect(lookup?.request.endpoint).toContain('email=')
    })

    it('answers the lookup with a flag the IF operator can compare against', () => {
        const [, support] = TUTORIAL_CONNECTORS
        const lookup = support.invoker.operations.find(o => o.name === 'getClientByEmail')
        expect(Object.keys(lookup?.response.success.body.fields ?? {})).toContain('found')
    })

    it('gives the create step the two fields the last step fills', () => {
        const [, support] = TUTORIAL_CONNECTORS
        const create = support.invoker.operations.find(o => o.name === 'createClient')
        expect(Object.keys(create?.request.body.fields ?? {})).toEqual(
            expect.arrayContaining(['email', 'username']))
    })

    it('orders the methods the way the step chain indexes them', () => {
        const [crm, support] = TUTORIAL_CONNECTORS
        expect(crm.invoker.operations[0].name).toBe('getCustomers')
        expect(support.invoker.operations[0].name).toBe('getClientByEmail')
        expect(support.invoker.operations[1].name).toBe('createClient')
    })
})
