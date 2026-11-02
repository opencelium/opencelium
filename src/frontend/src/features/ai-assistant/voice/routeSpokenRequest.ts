import { useSpokenRequestStore } from './spokenRequest.store'

/**
 * Where a request spoken to the assistant goes: to the palette, exactly as if it had been
 * spoken into its microphone. The palette's AI tries a workflow guide first in the editor
 * (see useAiCommandAssist), so voice, typing and the palette mic all behave the same.
 */
export function routeSpokenRequest(text: string): void {
    useSpokenRequestStore.getState().send(text)
}
