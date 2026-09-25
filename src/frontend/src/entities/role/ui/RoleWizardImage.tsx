import type {Mode} from '@/engine/entity/EntityDefinition'
import {resolveStorageUrl} from '@shared/utils/storageUrl'
import {WizardImageEditor} from '@shared/ui/wizard-image-editor/WizardImageEditor'

type Props = {
    mode?: Mode
}

export const RoleWizardImage = ({mode}: Props) => (
    <WizardImageEditor
        mode={mode}
        i18nPrefix="role.fields.icon"
        resolveUrl={resolveStorageUrl}
        testIdPrefix="role-icon"
    />
)
