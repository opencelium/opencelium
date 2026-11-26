import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import type {ReactNode} from 'react'

const mocks = vi.hoisted(() => {
    class ApiFetchError extends Error {
        readonly status: number
        readonly body?: unknown
        constructor(message: string, init: {status: number; body?: unknown}) {
            super(message)
            this.status = init.status
            this.body = init.body
        }
    }
    return {apiFetchWithHeaders: vi.fn(), emit: vi.fn(), ApiFetchError}
})

vi.mock('@shared/api/apiFetch', () => ({
    apiFetchWithHeaders: mocks.apiFetchWithHeaders,
    ApiFetchError: mocks.ApiFetchError,
    API_TIMEOUT_ERROR_NAME: 'ApiTimeoutError',
}))
vi.mock('@shared/errors/api/errorBus', () => ({errorBus: {emit: mocks.emit}}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({children, htmlType, testId}: {children?: ReactNode; htmlType?: 'submit' | 'button'; testId?: string}) => (
        <button type={htmlType ?? 'button'} data-testid={testId}>{children}</button>
    ),
}))
vi.mock('@shared/ui/primitives/Card', () => ({
    Card: ({children}: {children?: ReactNode}) => <div>{children}</div>,
}))
vi.mock('@shared/ui/primitives/Typography', () => ({
    Typography: ({children}: {children?: ReactNode}) => <span>{children}</span>,
}))
vi.mock('@shared/ui/primitives/Input', () => ({
    Input: ({value, onChange, name, testId}: {value: string; onChange: (e: unknown) => void; name: string; testId?: string}) => (
        <input name={name} value={value} onChange={onChange} data-testid={testId} />
    ),
}))

import {SetPasswordForm} from './SetPasswordForm'

const VALID_PASSWORD = 'Abcdef1!'

function renderAt(url: string) {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <SetPasswordForm />
        </MemoryRouter>,
    )
}

function submitValidPassword() {
    fireEvent.change(screen.getByTestId('set-password-password'), {target: {value: VALID_PASSWORD}})
    fireEvent.change(screen.getByTestId('set-password-repeat'), {target: {value: VALID_PASSWORD}})
    fireEvent.click(screen.getByTestId('set-password-submit'))
}

beforeEach(() => {
    mocks.apiFetchWithHeaders.mockReset()
    mocks.emit.mockReset()
})

describe('SetPasswordForm', () => {
    it.each(['/set-password', '/set-password?token=', '/set-password?token=%20'])(
        'shows the invalid-link view instead of the form when the token is missing (%s)',
        (url) => {
            renderAt(url)
            expect(screen.getByTestId('set-password-invalid-link')).toBeInTheDocument()
            expect(screen.getByTestId('set-password-request-new-link').closest('a')).toHaveAttribute('href', '/forgot-password')
            expect(screen.queryByTestId('set-password-submit')).not.toBeInTheDocument()
        },
    )

    it('switches to the invalid-link view without a toast when the backend rejects the token', async () => {
        mocks.apiFetchWithHeaders.mockRejectedValue(
            new mocks.ApiFetchError('bad', {status: 400, body: {error: 'INVALID_TOKEN'}}),
        )
        renderAt('/set-password?token=abc')
        submitValidPassword()

        expect(await screen.findByTestId('set-password-invalid-link')).toBeInTheDocument()
        expect(mocks.apiFetchWithHeaders).toHaveBeenCalledWith(
            '/auth/reset-password',
            expect.objectContaining({body: {token: 'abc', newPassword: VALID_PASSWORD, confirmPassword: VALID_PASSWORD}}),
        )
        expect(mocks.emit).not.toHaveBeenCalled()
    })

    it('keeps the form and reports a generic failure for other errors', async () => {
        mocks.apiFetchWithHeaders.mockRejectedValue(new mocks.ApiFetchError('boom', {status: 500}))
        renderAt('/set-password?token=abc')
        submitValidPassword()

        await waitFor(() =>
            expect(mocks.emit).toHaveBeenCalledWith({type: 'UNKNOWN', messageKey: 'setPassword.failed'}),
        )
        expect(screen.getByTestId('set-password-submit')).toBeInTheDocument()
        expect(screen.queryByTestId('set-password-invalid-link')).not.toBeInTheDocument()
    })

    it('shows the success message after a successful reset', async () => {
        mocks.apiFetchWithHeaders.mockResolvedValue({})
        renderAt('/set-password?token=abc')
        submitValidPassword()

        expect(await screen.findByText('setPassword.success.message')).toBeInTheDocument()
    })
})
