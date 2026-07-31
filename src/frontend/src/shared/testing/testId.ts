/**
 * Stable test-selector helpers shared across the app.
 *
 * Selectors are emitted as `data-testid` attributes so Selenium / Playwright can
 * locate elements without depending on antd/MUI-generated class names or ids.
 * IDs are *derived* from existing metadata (entity name, field name, action,
 * row id) rather than hand-written, so every current and future screen gets a
 * predictable selector for free.
 *
 * Convention: lowercase, hyphen-separated, segments composed left-to-right from
 * the most general scope to the most specific, e.g.
 *   `user-field-username`            (entity-scoped form field)
 *   `role-row-action-delete-42`      (list row action)
 *   `wizard-btn-submit`              (wizard navigation button)
 */

export const TEST_ID_ATTR = 'data-testid' as const

/** Normalize an arbitrary value into a selector-safe segment. */
export function slugifyTestId(value: string | number): string {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '')
}

/**
 * Compose a `data-testid` value from ordered parts. Nullish / empty parts are
 * dropped, so callers can pass optional scopes without guarding each one:
 *   buildTestId(scope, 'field', name) // scope may be undefined
 */
export function buildTestId(
    ...parts: Array<string | number | null | undefined>
): string | undefined {
    const segments = parts
        .filter((part): part is string | number => part !== null && part !== undefined && part !== '')
        .map(slugifyTestId)
        .filter(Boolean)

    return segments.length > 0 ? segments.join('-') : undefined
}

/**
 * Spread-friendly attribute object. Returns an empty object when no id is given
 * so `{...testIdProps(undefined)}` renders nothing (no stray `data-testid`).
 */
export function testIdProps(
    testId: string | undefined,
): Record<string, string> {
    return testId ? { [TEST_ID_ATTR]: testId } : {}
}
