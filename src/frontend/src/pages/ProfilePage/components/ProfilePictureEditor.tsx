import { useState } from 'react'
import { message } from 'antd'
import { useAuth } from '@features/auth/useAuth'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { resolveStorageUrl } from '@shared/utils/storageUrl'
import { ImageTileEditor } from '@shared/ui/wizard-image-editor/ImageTileEditor'
import {
    deleteProfilePicture,
    syncOwnProfilePicture,
    uploadProfilePicture,
} from '@entities/user/lib/profilePicture'
import { useGravatarRefresh } from '@entities/user/ui/useGravatarRefresh'

type Props = {
    readOnly?: boolean
}

/**
 * Uploads as soon as the crop is applied (or a Gravatar is fetched), and deletes right
 * after the confirm — the picture has its own endpoints, so it is not part of the
 * details form's Save.
 */
export function ProfilePictureEditor({ readOnly }: Props) {
    const { user } = useAuth()
    const { t } = useI18n('entities')
    const confirm = useConfirm()
    const [isBusy, setIsBusy] = useState(false)
    const gravatar = useGravatarRefresh({
        email: user?.email,
        testIdPrefix: 'profile-picture',
        onFile: file => handlePicked(file),
    })

    if (!user) return null
    const email = user.email
    const storedPath = user.userDetail?.profilePicture ?? null

    async function handlePicked(file: File) {
        if (!user || !email) return
        setIsBusy(true)
        try {
            await uploadProfilePicture(file, email)
            await syncOwnProfilePicture(user.userId)
            message.success(t('profile.messages.pictureUpdated'))
        } catch (error) {
            console.error(error)
            notifyError(t('profile.messages.pictureUpdateFailed'))
        } finally {
            setIsBusy(false)
        }
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: t('user.fields.profilePicture.confirmDelete.title'),
            message: t('user.fields.profilePicture.confirmDelete.message'),
        })
        if (!ok) return
        setIsBusy(true)
        try {
            await deleteProfilePicture(user.userId)
            await syncOwnProfilePicture(user.userId)
            message.success(t('profile.messages.pictureDeleted'))
        } catch (error) {
            console.error(error)
            notifyError(t('profile.messages.pictureDeleteFailed'))
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <ImageTileEditor
            src={resolveStorageUrl(storedPath)}
            fileName={storedPath?.split('/').pop()}
            isInteractive={!readOnly && !!email}
            isLoading={isBusy || gravatar.isLoading}
            i18nPrefix="user.fields.profilePicture"
            testIdPrefix="profile-picture"
            onPicked={file => void handlePicked(file)}
            onDelete={() => void handleDelete()}
            extraActions={gravatar.actions}
        />
    )
}
