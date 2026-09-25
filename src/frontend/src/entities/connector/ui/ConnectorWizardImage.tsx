import type {Mode} from '@/engine/entity/EntityDefinition'
import {resolveConnectorIconUrl} from '@entities/connector/model/iconUrl'
import {WizardImageEditor} from '@shared/ui/wizard-image-editor/WizardImageEditor'

type Props = {
    mode?: Mode
}

export const ConnectorWizardImage = ({mode}: Props) => (
    <WizardImageEditor
        mode={mode}
        i18nPrefix="connector.fields.icon"
        resolveUrl={resolveConnectorIconUrl}
        testIdPrefix="connector-icon"
    />
)
