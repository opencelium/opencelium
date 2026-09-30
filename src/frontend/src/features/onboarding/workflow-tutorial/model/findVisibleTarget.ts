/** A rect is unusable as a target when it lies wholly outside the viewport. */
const isOffscreen = (rect: DOMRect) =>
    rect.right <= 0 ||
    rect.bottom <= 0 ||
    rect.left >= window.innerWidth ||
    rect.top >= window.innerHeight

/**
 * The element a selector should highlight — the first *visible* match, not simply the
 * first match. Two kinds of invisible candidate exist and they must not be treated
 * alike:
 *
 * - `opacity: 0` — the canvas parks a hover-only `+` at every insertion point. It is
 *   where it appears to be, and the tutorial forces it visible once highlighted (see
 *   `[data-tutorial-highlight]`), so it is worth falling back to.
 * - `visibility: hidden` / `display: none` / off-viewport — a closed sidebar drawer is
 *   still mounted at `translateX(100%)`, so its rows report real bounding boxes just
 *   past the right edge. Falling back to one of those aims the spotlight off-screen at
 *   a control the user cannot see, which is worse than admitting the target is absent:
 *   `resolveHighlight` walks a chain from the deepest link back, so a phantom match
 *   silently outranks the `+` the user is actually meant to click.
 */
/**
 * What an element is showing, which is not always its `textContent`: a control can
 * display its value through an `<input>`, where the text is a DOM property and not a
 * child node. The reference generator's field picker is exactly that — it renders the
 * chosen path as the select's search value and never as a selection item (see
 * bodyLegacy.css) — so a match on text alone would never see the path the user built.
 */
const shownText = (element: HTMLElement): string => {
    const fields = Array.from(element.querySelectorAll<HTMLInputElement>('input, textarea'))
    return [element.textContent ?? '', ...fields.map(field => field.value)].join(' ')
}

export function findVisibleTarget(selector: string, text?: string): HTMLElement | null {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector))
        // Some rows are only distinguishable by what they say: the request body is a
        // JSON tree whose rows carry no identity of their own beyond the key they show.
        .filter(element => !text || shownText(element).includes(text))
    let transparent: HTMLElement | null = null

    for (const element of candidates) {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        if (isOffscreen(rect)) continue

        const style = getComputedStyle(element)
        // `visibility` inherits, so this also rejects anything inside a closed drawer.
        if (style.visibility === 'hidden' || style.display === 'none') continue
        if (Number(style.opacity) === 0) {
            transparent ??= element
            continue
        }

        return element
    }

    return transparent
}
