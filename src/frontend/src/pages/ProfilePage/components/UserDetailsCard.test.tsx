import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFormContext } from 'react-hook-form'
import type { AuthSession, AuthUser } from '@entities/auth/model/types'
import type { UserUpdateRequestDTO } from '@entities/user/api/userApi'

let session: AuthSession | null = null
const dispatch = vi.fn()

vi.mock('@shared/i18n/hooks/useI18n', () => ({
    useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}))
vi.mock('@shared/lib/storeHooks', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: () => session,
}))
vi.mock('@entities/auth/model/authSelectors', () => ({ selectAuthSession: () => session }))
vi.mock('@entities/auth/model/authSlice', () => ({
    authActions: { setSession: (payload: unknown) => ({ type: 'auth/setSession', payload }) },
}))
vi.mock('@features/auth/useAuth', () => ({
    useAuth: () => ({ user: session?.user, normalizedUser: session?.normalizedUser }),
}))
vi.mock('@/engine/policy', () => ({ hasComponentPermission: () => true }))

// The endpoint echoes the request resource back, which is why the component must
// not feed the result into the session.
const unwrap = vi.fn(async () => undefined)
type UpdateArg = { userId: number; body: UserUpdateRequestDTO }
const updateUser = vi.fn((arg: UpdateArg) => ({ unwrap, arg }))
vi.mock('@entities/user/api/userApi', () => ({
    useUpdateUserMutation: () => [updateUser, { isLoading: false }],
}))

const messageSuccess = vi.fn()
vi.mock('antd', async (importOriginal) => ({
    ...(await importOriginal<typeof import('antd')>()),
    message: { success: (text: string) => messageSuccess(text) },
}))

const notifyError = vi.fn()
vi.mock('@shared/ui/feedback/notifyError', () => ({
    notifyError: (text: string) => notifyError(text),
}))

// Provider-free primitive stand-ins (the real ones need SystemProvider). FormInput
// keeps its react-hook-form registration so the submitted values are real.
vi.mock('@shared/ui/primitives/Card', () => ({
    Card: ({ children }: { children?: ReactNode }) => <section>{children}</section>,
}))
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) => (
        <button type="submit" {...(rest as object)}>{children}</button>
    ),
}))
vi.mock('@shared/ui/primitives/Text', () => ({
    EntityText: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}))
vi.mock('@shared/form/FormConstraintsContext', () => ({
    FormConstraintsProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))
vi.mock('@shared/ui/form/FormInput', () => ({
    FormInput: ({ name, label }: { name: string; label: string }) => {
        const { register } = useFormContext()
        return <input aria-label={label} {...register(name)} />
    },
}))
vi.mock('@pages/ProfilePage/components/UserTitleField', () => ({
    UserTitleField: () => null,
}))

import { UserDetailsCard } from './UserDetailsCard'

const USER_DETAIL = {
    name: 'Ada',
    surname: 'Lovelace',
    userTitle: 'mrs',
    phoneNumber: '+49 30 1234',
    department: 'R&D',
    organization: 'OpenCelium',
    profilePicture: 'ada.png',
    appTour: true,
    theme: 'ci-dark',
    themeSync: true,
    lang: 'de',
    bitbucketUser: 'ada',
    bitbucketPassword: 'secret',
    requestTime: 42,
} as unknown as AuthUser['userDetail']

const USER_GROUP = {
    groupId: 3, name: 'Admin', description: null, icon: null, components: [],
} as unknown as AuthUser['userGroup']

const buildSession = (overrides: Partial<AuthUser> = {}): AuthSession => ({
    accessToken: 'token',
    user: {
        userId: 7,
        email: 'ada@opencelium.io',
        username: 'ada',
        totpEnabled: true,
        userGroup: USER_GROUP,
        userDetail: USER_DETAIL,
        widgetSettings: [{ widgetId: 1 }],
        ...overrides,
    },
    normalizedUser: { roles: [], permissions: [] },
} as unknown as AuthSession)

/** The body of the one PUT this save made, or a failure if it made none. */
const sentBody = () => {
    const call = updateUser.mock.calls[0]
    if (!call) throw new Error('updateUser was never called')
    return call[0].body
}

const save = async () => {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'profile.actions.save' }))
}

beforeEach(() => {
    session = buildSession()
    dispatch.mockClear()
    updateUser.mockClear()
    unwrap.mockClear()
    messageSuccess.mockClear()
    notifyError.mockClear()
})

describe('UserDetailsCard save', () => {
    it('sends the whole fetched record, not just the edited fields', async () => {
        render(<UserDetailsCard />)
        await save()

        await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(1))
        expect(updateUser).toHaveBeenCalledWith({
            userId: 7,
            body: {
                // PUT /user/{id} is a full replace: userId and userGroup have to
                // ride along or the backend rebuilds the record without them.
                userId: 7,
                email: 'ada@opencelium.io',
                username: 'ada',
                userGroup: 3,
                userDetail: USER_DETAIL,
            },
        })
    })

    it('lays the edited fields over the fetched detail and keeps the rest', async () => {
        render(<UserDetailsCard />)
        const user = userEvent.setup()
        await user.clear(screen.getByLabelText('profile.fields.surname.label'))
        await user.type(screen.getByLabelText('profile.fields.surname.label'), 'Byron')
        await save()

        await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(1))
        const { userDetail } = sentBody()
        expect(userDetail.surname).toBe('Byron')
        // Everything this form never shows survives the save.
        expect(userDetail).toMatchObject({
            profilePicture: 'ada.png', appTour: true, theme: 'ci-dark',
            themeSync: true, lang: 'de', bitbucketUser: 'ada', requestTime: 42,
        })
    })

    it('keeps the group and widget settings in the session, not the echoed body', async () => {
        render(<UserDetailsCard />)
        await save()

        await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1))
        const { user } = dispatch.mock.calls[0][0].payload
        expect(user.userGroup).toBe(USER_GROUP)
        expect(user.widgetSettings).toEqual([{ widgetId: 1 }])
        expect(user.totpEnabled).toBe(true)
        expect(messageSuccess).toHaveBeenCalledWith('profile.messages.detailsUpdated')
    })

    it('sends an emptied email or username as null rather than an empty string', async () => {
        render(<UserDetailsCard />)
        const user = userEvent.setup()
        await user.clear(screen.getByLabelText('profile.fields.email.label'))
        await save()

        await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(1))
        expect(sentBody().email).toBeNull()
        expect(sentBody().username).toBe('ada')
    })

    it('refuses to send a body that would strip the group, and says so', async () => {
        session = buildSession({ userGroup: undefined as unknown as AuthUser['userGroup'] })
        render(<UserDetailsCard />)
        await save()

        await waitFor(() =>
            expect(notifyError).toHaveBeenCalledWith('profile.messages.detailsUpdateFailed'))
        expect(updateUser).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })
})
