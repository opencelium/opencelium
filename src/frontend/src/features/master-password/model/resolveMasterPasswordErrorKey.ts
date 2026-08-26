import { i18n } from '@shared/i18n/config/i18n'

export type MasterPasswordErrorBody = { error?: string; message?: string }

/**
 * The backend raises `GeneralServiceException(400, "MASTER_PASSWORD_WRONG", "Invalid master
 * password")`, but its catch-all `@ExceptionHandler(Exception.class)` in
 * `ResponseExceptionHandler` can win the advice-ordering race against `GlobalExceptionHandler`
 * — neither carries `@Order`, and Spring takes the first advice with *any* match rather than
 * the most specific one — and rewrite the reply to a 500 whose `error` is just the status
 * reason phrase (`INTERNAL_SERVER_ERROR`). The human `message` survives that rewrite untouched,
 * so it is the only thing left that distinguishes a wrong password from a real server fault.
 */
const CODE_BY_SERVER_MESSAGE: Record<string, string> = {
    // ExceptionMessages.MASTER_PASSWORD_WRONG
    'invalid master password': 'MASTER_PASSWORD_WRONG',
}

const existingKey = (code: string | undefined): string | undefined => {
    if (!code) return undefined
    const key = `masterPassword.error.${code}`
    return i18n.exists(key, { ns: 'widget' }) ? key : undefined
}

/** The `widget` key holding the copy for a failed master-password check. */
export const resolveMasterPasswordErrorKey = (body?: MasterPasswordErrorBody): string =>
    existingKey(body?.error)
    ?? existingKey(CODE_BY_SERVER_MESSAGE[body?.message?.trim().toLowerCase() ?? ''])
    ?? 'masterPassword.error.default'
