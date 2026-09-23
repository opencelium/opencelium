import type {Mode} from '@/engine/entity/EntityDefinition'
import {resolveStorageUrl} from '@shared/utils/storageUrl'
import {WizardImageEditor} from '@shared/ui/wizard-image-editor/WizardImageEditor'

type Props = {
    mode?: Mode
}

// No delete: the backend has no endpoint to remove a profile picture yet, and the user
// PUT always keeps the stored one.
export const UserWizardImage = ({mode}: Props) => (
    <WizardImageEditor
        mode={mode}
        fieldName="profilePicture"
        i18nPrefix="user.fields.profilePicture"
        resolveUrl={resolveStorageUrl}
        testIdPrefix="user-picture"
        canDelete={false}
    />
)
