import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'

const mocks = vi.hoisted(() => ({emailHealth: vi.fn()}))

vi.mock('@entities/updateAssistant/api/updateAssistantApi', () => ({
    useGetEmailHealthQuery: mocks.emailHealth,
}))
vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({t: (key: string) => key, lang: 'en'}),
}))
vi.mock('@shared/ui/primitives/Typography', () => ({
    Typography: ({children}: {children?: ReactNode}) => <span>{children}</span>,
}))
vi.mock('@shared/ui/primitives/Checkbox', () => ({
    Checkbox: ({checked, disabled, onChange, testId}: {checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; testId?: string}) => (
        <input type="checkbox" checked={checked} disabled={disabled} data-testid={testId}
            onChange={(event) => onChange(event.target.checked)} />
    ),
}))

import {PasswordResetLinkConfirmMessage} from './PasswordResetLinkConfirmMessage'

const checkbox = () => screen.getByTestId('user-reset-link-send-email') as HTMLInputElement
const HINT = 'user.resetLink.confirm.emailUnavailable'

describe('PasswordResetLinkConfirmMessage', () => {
    beforeEach(() => mocks.emailHealth.mockReset())

    it('lets the admin opt into email when the mail server is up', () => {
        mocks.emailHealth.mockReturnValue({data: {status: 'UP'}, isLoading: false})
        const onChange = vi.fn()
        render(<PasswordResetLinkConfirmMessage userLabel="anna" hasEmail onSendEmailChange={onChange} />)
        expect(checkbox().disabled).toBe(false)
        fireEvent.click(checkbox())
        expect(checkbox().checked).toBe(true)
        expect(onChange).toHaveBeenCalledWith(true)
        expect(screen.queryByText(HINT)).toBeNull()
    })

    it('keeps email unchecked and disabled with a hint when mail is not set up', () => {
        mocks.emailHealth.mockReturnValue({data: {status: 'DOWN', details: {error: 'Host or Port is not set.'}}, isLoading: false})
        render(<PasswordResetLinkConfirmMessage userLabel="anna" hasEmail onSendEmailChange={vi.fn()} />)
        expect(checkbox().checked).toBe(false)
        expect(checkbox().disabled).toBe(true)
        expect(screen.getByText(HINT)).toBeTruthy()
    })

    it('keeps email unchecked and disabled for a user without an email address, without asking the server', () => {
        mocks.emailHealth.mockReturnValue({data: undefined, isLoading: false})
        render(<PasswordResetLinkConfirmMessage userLabel="anna" hasEmail={false} onSendEmailChange={vi.fn()} />)
        expect(checkbox().checked).toBe(false)
        expect(checkbox().disabled).toBe(true)
        expect(screen.getByText('user.resetLink.error.emailNotFound')).toBeTruthy()
        expect(mocks.emailHealth).toHaveBeenCalledWith(undefined, {skip: true})
    })

    it('waits for the status before offering email', () => {
        mocks.emailHealth.mockReturnValue({data: undefined, isLoading: true})
        render(<PasswordResetLinkConfirmMessage userLabel="anna" hasEmail onSendEmailChange={vi.fn()} />)
        expect(checkbox().disabled).toBe(true)
        expect(screen.queryByText(HINT)).toBeNull()
    })

    it('leaves the choice open when the status cannot be read', () => {
        mocks.emailHealth.mockReturnValue({data: undefined, isLoading: false, isError: true})
        render(<PasswordResetLinkConfirmMessage userLabel="anna" hasEmail onSendEmailChange={vi.fn()} />)
        expect(checkbox().disabled).toBe(false)
    })
})
