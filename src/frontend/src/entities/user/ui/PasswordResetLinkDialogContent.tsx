import { useI18n } from '@shared/i18n/hooks/useI18n'
import { CopyButton } from '@shared/ui/actions/CopyButton'
import { Hint } from '@shared/ui/primitives/Hint'
import { Input } from '@shared/ui/primitives/Input'
import { Typography } from '@shared/ui/primitives/Typography'
import type { PasswordResetLinkDto } from '@entities/user/model/types'

type Props = {
    link: PasswordResetLinkDto
    userLabel: string
    isEmailSent: boolean
}

export function PasswordResetLinkDialogContent({ link, userLabel, isEmailSent }: Props) {
    const { t, lang } = useI18n('entities')
    const url = link.link
    const expiresAt = new Date(link.expiresAt)
    const expiry = Number.isNaN(expiresAt.getTime())
        ? link.expiresAt
        : expiresAt.toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Typography variant="body">{t(isEmailSent ? 'user.resetLink.dialog.descriptionEmailSent' : 'user.resetLink.dialog.description', {
                    user: userLabel,
                })}</Typography>
            <Input
                type="text"
                value={url}
                readOnly
                rightSlot={<CopyButton value={url} testId="user-reset-link-copy" />}
                testId="user-reset-link-url"
            />
            <Typography variant="caption" isSubtle>
                {t('user.resetLink.dialog.expiresAt', { expiry })}
            </Typography>
            <Hint noPrefix>{t('user.resetLink.dialog.securityHint')}</Hint>
        </div>
    )
}
