import { useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Checkbox } from '@shared/ui/primitives/Checkbox'
import { Typography } from '@shared/ui/primitives/Typography'

type Props = {
    userLabel: string
    onSendEmailChange: (sendEmail: boolean) => void
}

export function PasswordResetLinkConfirmMessage({ userLabel, onSendEmailChange }: Props) {
    const { t } = useI18n('entities')
    const [isSendEmail, setIsSendEmail] = useState(false)

    const handleChange = (checked: boolean) => {
        setIsSendEmail(checked)
        onSendEmailChange(checked)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Typography variant="body">{t('user.resetLink.confirm.message', { user: userLabel })}</Typography>
            <Checkbox
                checked={isSendEmail}
                onChange={handleChange}
                label={t('user.resetLink.confirm.sendEmail')}
                testId="user-reset-link-send-email"
            />
        </div>
    )
}
