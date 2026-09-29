import { afterEach, describe, expect, it, vi } from 'vitest'
import { onlineStatus } from './onlineStatus'

function setNavigatorOnline(value: boolean): void {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

afterEach(() => {
    setNavigatorOnline(true)
    onlineStatus.refresh()
})

describe('onlineStatus', () => {
    it('notifies subscribers when the browser goes offline and comes back', () => {
        const listener = vi.fn()
        const unsubscribe = onlineStatus.subscribe(listener)

        setNavigatorOnline(false)
        window.dispatchEvent(new Event('offline'))
        expect(onlineStatus.getSnapshot()).toBe(false)
        expect(listener).toHaveBeenCalledTimes(1)

        setNavigatorOnline(true)
        window.dispatchEvent(new Event('online'))
        expect(onlineStatus.getSnapshot()).toBe(true)
        expect(listener).toHaveBeenCalledTimes(2)

        unsubscribe()
    })

    it('stops reacting once the last subscriber leaves', () => {
        const listener = vi.fn()
        onlineStatus.subscribe(listener)()

        setNavigatorOnline(false)
        window.dispatchEvent(new Event('offline'))

        expect(listener).not.toHaveBeenCalled()
        expect(onlineStatus.getSnapshot()).toBe(true)
    })
})
