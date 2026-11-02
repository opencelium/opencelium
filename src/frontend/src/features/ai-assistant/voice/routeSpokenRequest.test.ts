import { afterEach, describe, expect, it, vi } from 'vitest'

const guide = vi.hoisted(() => ({ result: 'started' as string, asked: [] as string[] }))
vi.mock('@features/onboarding/guides/model/askWorkflowGuide', () => ({
    askWorkflowGuide: async (text: string) => {
        guide.asked.push(text)
        return guide.result
    },
}))

import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { routeSpokenRequest } from './routeSpokenRequest'
import { useSpokenRequestStore } from './spokenRequest.store'

describe('routeSpokenRequest', () => {
    afterEach(() => {
        workflowCommandBridgeStore.setState({ isActive: false })
        useSpokenRequestStore.setState({ pending: null })
        guide.asked = []
    })

    it('runs a guide in the editor and leaves the palette alone', async () => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = 'started'
        await routeSpokenRequest('where is the header')
        expect(guide.asked).toEqual(['where is the header'])
        expect(useSpokenRequestStore.getState().pending).toBeNull()
    })

    it.each(['no-guide', 'failed'])('hands the request to the palette when the guide answers %s', async (result) => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = result
        await routeSpokenRequest('list the users')
        expect(useSpokenRequestStore.getState().pending).toBe('list the users')
    })

    it('keeps a named method that is not there away from the palette', async () => {
        workflowCommandBridgeStore.setState({ isActive: true })
        guide.result = 'no-match'
        await routeSpokenRequest('headers of updateTicket')
        expect(useSpokenRequestStore.getState().pending).toBeNull()
    })

    it('goes straight to the palette outside the editor', async () => {
        await routeSpokenRequest('zeige alle Rollen')
        expect(guide.asked).toEqual([])
        expect(useSpokenRequestStore.getState().pending).toBe('zeige alle Rollen')
    })
})
