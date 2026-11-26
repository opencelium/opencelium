import { useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Typography } from '@shared/ui/primitives/Typography'
import { useGetEmailHealthQuery } from '@entities/updateAssistant/api/updateAssistantApi'

type Props = {
    userLabel: string
    hasEmail: boolean
    onSendEmailChange: (sendEmail: boolean) => void
}

export function PasswordResetLinkConfirmMessage({ userLabel, hasEmail, onSendEmailChange }: Props) {
    const { t } = useI18n('entities')
    const [isSendEmail, setIsSendEmail] = useState(false)
    const { data: emailHealth, isLoading } = useGetEmailHealthQuery(undefined, { skip: !hasEmail })
    // An unreadable status leaves the choice open; the backend still refuses a send that fails.
    const isMailServerDown = !!emailHealth && emailHealth.status !== 'UP'
    const isEmailUnavailable = !hasEmail || isMailServerDown
    const hintKey = !hasEmail ? 'user.resetLink.error.emailNotFound' : 'user.resetLink.confirm.emailUnavailable'

    const handleChange = (checked: boolean) => {
        setIsSendEmail(checked)
        onSendEmailChange(checked)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Typography variant="body">{t('user.resetLink.confirm.message', { user: userLabel })}</Typography>
            <Checkbox
                checked={isSendEmail && !isEmailUnavailable}
                disabled={(hasEmail && isLoading) || isEmailUnavailable}
                onChange={handleChange}
                label={t('user.resetLink.confirm.sendEmail')}
                testId="user-reset-link-send-email"
            />
            {isEmailUnavailable && (
                <Typography variant="caption" isSubtle>
                    {t(hintKey)}
                </Typography>
            )}
        </div>
    )
}
