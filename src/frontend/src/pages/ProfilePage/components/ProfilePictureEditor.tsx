import { useState } from 'react'
import { message } from 'antd'
import { useAuth } from '@features/auth/useAuth'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { notifyError } from '@shared/ui/feedback/notifyError'
import { resolveStorageUrl } from '@shared/utils/storageUrl'
import { ImageTileEditor } from '@shared/ui/wizard-image-editor/ImageTileEditor'
import { syncOwnProfilePicture, uploadProfilePicture } from '@entities/user/lib/profilePicture'

type Props = {
    readOnly?: boolean
}

/**
 * Uploads as soon as the crop is applied — the picture has its own endpoint, so it is
 * not part of the details form's Save. No delete: the backend has no endpoint for it yet.
 */
export function ProfilePictureEditor({ readOnly }: Props) {
    const { user } = useAuth()
    const { t } = useI18n('entities')
    const [isUploading, setIsUploading] = useState(false)

    if (!user) return null
    const email = user.email
    const storedPath = user.userDetail?.profilePicture ?? null

    const handlePicked = async (file: File) => {
        if (!email) return
        setIsUploading(true)
        try {
            await uploadProfilePicture(file, email)
            await syncOwnProfilePicture(user.userId)
            message.success(t('profile.messages.pictureUpdated'))
        } catch (error) {
            console.error(error)
            notifyError(t('profile.messages.pictureUpdateFailed'))
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <ImageTileEditor
            src={resolveStorageUrl(storedPath)}
            fileName={storedPath?.split('/').pop()}
            isInteractive={!readOnly && !!email}
            isLoading={isUploading}
            i18nPrefix="user.fields.profilePicture"
            testIdPrefix="profile-picture"
            onPicked={file => void handlePicked(file)}
        />
    )
}
