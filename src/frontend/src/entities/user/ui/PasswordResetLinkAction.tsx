import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { TooltipPlacement } from '@shared/ui/primitives/Tooltip/Tooltip.types'
import type { User } from '@entities/user/model/types'
import { PasswordResetLinkDialogContent } from './PasswordResetLinkDialogContent'
import { useCreatePasswordResetLink } from './useCreatePasswordResetLink'

type Props = {
    user: User
    iconSize?: number
    tooltipPlacement?: TooltipPlacement
}

export function PasswordResetLinkAction({ user, iconSize, tooltipPlacement = 'top' }: Props) {
    const isAdmin = useIsAdmin()
    const { t } = useI18n('entities')
    const confirm = useConfirm()
    const dialog = useDialog()
    const { create, isCreating } = useCreatePasswordResetLink()

    if (!isAdmin || user.authMethod === 'LDAP') return null

    const userLabel = user.email ?? user.username ?? String(user.userId)

    const handleClick = async () => {
        const ok = await confirm({
            title: t('user.resetLink.confirm.title'),
            message: t('user.resetLink.confirm.message', { user: userLabel }),
        })
        if (!ok) return
        const link = await create(user.userId)
        if (!link) return
        dialog.open({
            title: t('user.resetLink.dialog.title'),
            width: 600,
            testId: 'user-reset-link-dialog',
            content: <PasswordResetLinkDialogContent link={link} userLabel={userLabel} />,
        })
    }

    return (
        <Tooltip content={t('user.resetLink.tooltip')} placement={tooltipPlacement}>
            <IconButton
                iconProps={{ name: 'password-reset', color: 'primary', size: iconSize }}
                type="text"
                size="xs"
                loading={isCreating}
                onClick={handleClick}
                testId={`user-row-action-reset-link-${user.userId}`}
            />
        </Tooltip>
    )
}
