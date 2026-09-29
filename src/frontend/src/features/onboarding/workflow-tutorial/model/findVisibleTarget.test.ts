import { afterEach, describe, expect, it } from 'vitest'
import { findVisibleTarget } from './findVisibleTarget'

const html = (markup: string) => { document.body.innerHTML = markup }

// jsdom reports 0x0 for everything, so give the elements a measurable box.
const boxed = (extra = '') => `style="width:20px;height:20px;${extra}"`
const withRect = (element: HTMLElement, left = 0, top = 0) => {
    element.getBoundingClientRect = () => ({ width: 20, height: 20, top, left, right: left + 20, bottom: top + 20, x: left, y: top, toJSON: () => ({}) })
}

describe('findVisibleTarget', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('skips the invisible match and returns the visible one', () => {
        html(`<button class="t" ${boxed('opacity:0')} id="hidden"></button>
              <button class="t" ${boxed('opacity:1')} id="shown"></button>`)
        document.querySelectorAll<HTMLElement>('.t').forEach(element => withRect(element))
        expect(findVisibleTarget('.t')?.id).toBe('shown')
    })

    it('falls back to a hidden match rather than pointing at nothing', () => {
        html(`<button class="t" ${boxed('opacity:0')} id="only"></button>`)
        document.querySelectorAll<HTMLElement>('.t').forEach(element => withRect(element))
        expect(findVisibleTarget('.t')?.id).toBe('only')
    })

    it('ignores an element with no box at all', () => {
        html(`<button class="t" id="unlaid"></button>`)
        expect(findVisibleTarget('.t')).toBeNull()
    })

    it('skips display:none and visibility:hidden', () => {
        html(`<button class="t" ${boxed('visibility:hidden')} id="invisible"></button>
              <button class="t" ${boxed()} id="fine"></button>`)
        document.querySelectorAll<HTMLElement>('.t').forEach(element => withRect(element))
        expect(findVisibleTarget('.t')?.id).toBe('fine')
    })

    it('returns null when nothing matches', () => {
        expect(findVisibleTarget('.nope')).toBeNull()
    })

    // A closed sidebar drawer stays mounted at translateX(100%), so its rows report a
    // real box just past the right edge. Falling back to one aimed the spotlight at a
    // control the user could not see, which is what hid the canvas `+`.
    it('rejects a match parked outside the viewport', () => {
        html(`<button class="t" ${boxed()} id="offscreen"></button>`)
        withRect(document.querySelector<HTMLElement>('.t')!, window.innerWidth, 0)
        expect(findVisibleTarget('.t')).toBeNull()
    })

    it('prefers an on-screen match over one parked outside the viewport', () => {
        html(`<button class="t" ${boxed()} id="offscreen"></button>
              <button class="t" ${boxed()} id="onscreen"></button>`)
        withRect(document.querySelector<HTMLElement>('#offscreen')!, window.innerWidth, 0)
        withRect(document.querySelector<HTMLElement>('#onscreen')!)
        expect(findVisibleTarget('.t')?.id).toBe('onscreen')
    })

    it('never falls back to a visibility:hidden match', () => {
        html(`<button class="t" ${boxed('visibility:hidden')} id="only"></button>`)
        document.querySelectorAll<HTMLElement>('.t').forEach(element => withRect(element))
        expect(findVisibleTarget('.t')).toBeNull()
    })

    // The real drawer sets visibility on the container, not the row; the row is only
    // hidden because visibility inherits. Pinned so a jsdom change is visible here
    // rather than as a silently weaker guarantee.
    it('treats a row inside a visibility:hidden container as hidden', () => {
        html(`<div ${boxed('visibility:hidden')}><button class="t" ${boxed()} id="row"></button></div>`)
        document.querySelectorAll<HTMLElement>('.t').forEach(element => withRect(element))
        expect(findVisibleTarget('.t')).toBeNull()
    })

    // A control can show its value through an <input>, where the text is a DOM property
    // rather than a child node: the reference generator's field picker renders the path
    // it has built as the select's search value, so textContent alone never sees it.
    it('reads the text a control shows through an input, not only its children', () => {
        html('<div class="picker"><input value="customers[i].email"></div>'
            + '<div class="picker"><input value="customers"></div>')
        document.querySelectorAll<HTMLElement>('.picker').forEach(element => withRect(element))

        expect(findVisibleTarget('.picker', 'customers[i].email')).not.toBeNull()
        expect(findVisibleTarget('.picker', 'customers[i].nope')).toBeNull()
    })
})
