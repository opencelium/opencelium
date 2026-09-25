/**
 * Lets a caller perform one navigation without the unsaved-changes prompt.
 *
 * The guard exists to protect real work, so the exception is deliberately narrow: a
 * counter raised only for the duration of a synchronous call, never a flag left armed
 * for "the next navigation, whenever it happens" — that would silently wave through
 * an unrelated one if the intended navigation never occurred.
 *
 * The workflow tutorial is the caller: it resets its canvas by re-navigating to the
 * route it is already on, and its graph is invented data that saving is blocked for
 * anyway, so there is nothing for the prompt to protect.
 */
let depth = 0

export function runWithoutUnsavedChangesGuard(run: () => void): void {
    depth += 1
    try {
        run()
    } finally {
        depth -= 1
    }
}

export function isUnsavedChangesGuardSuppressed(): boolean {
    return depth > 0
}
