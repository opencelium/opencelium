import {message} from 'antd'
import {useFormContext, useWatch} from 'react-hook-form'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {resolveStorageUrl} from '@shared/utils/storageUrl'
import {WizardImageEditor} from '@shared/ui/wizard-image-editor/WizardImageEditor'
import {useGravatarRefresh} from '@entities/user/ui/useGravatarRefresh'

type Props = {
    mode?: Mode
}

const TEST_ID_PREFIX = 'user-picture'

export const UserWizardImage = ({mode}: Props) => {
    const {setValue} = useFormContext()
    const {t} = useI18n('entities')
    const email = useWatch({name: 'email'})

    const gravatar = useGravatarRefresh({
        email,
        testIdPrefix: TEST_ID_PREFIX,
        onFile: file => {
            setValue('profilePicture', file, {shouldDirty: true})
            message.success(t('user.fields.profilePicture.gravatar.staged'))
        },
    })

    return (
        <WizardImageEditor
            mode={mode}
            fieldName="profilePicture"
            i18nPrefix="user.fields.profilePicture"
            resolveUrl={resolveStorageUrl}
            testIdPrefix={TEST_ID_PREFIX}
            isLoading={gravatar.isLoading}
            extraActions={gravatar.actions}
        />
    )
}
