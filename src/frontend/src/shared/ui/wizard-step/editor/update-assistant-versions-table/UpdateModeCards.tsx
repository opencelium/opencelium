import { useFormContext } from 'react-hook-form'
import type { UpdateMode } from '@entities/updateAssistant/model/types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import { Radio } from '@shared/ui/primitives/Radio'
import { useSelectUpdateMode } from './useSelectUpdateMode'

const MODE_OPTIONS: { mode: UpdateMode; icon: IconName }[] = [
    { mode: 'online', icon: 'cloud' },
    { mode: 'offline', icon: 'package' },
]

export function UpdateModeCards() {
    const { t } = useI18n('entities')
    const { watch } = useFormContext()
    const selectMode = useSelectUpdateMode()
    const current: UpdateMode = watch('updateMode') ?? 'online'

    return (
        <div className="ua-modes" role="radiogroup">
            {MODE_OPTIONS.map(({ mode, icon }) => {
                const isSelected = current === mode
                return (
                    <div
                        key={mode}
                        className={`ua-mode-card${isSelected ? ' ua-mode-card--selected' : ''}`}
                        onClick={() => selectMode(mode)}
                        data-testid={`update-assistant-mode-${mode}`}
                    >
                        <span className="ua-mode-card__icon">
                            <Icon name={icon} size={20} color="inherit" />
                        </span>
                        <div className="ua-mode-card__body">
                            <div className="ua-title">
                                {t(`update-assistant.availableUpdates.modes.${mode}.title`)}
                            </div>
                            <div className="ua-description">
                                {t(`update-assistant.availableUpdates.modes.${mode}.description`)}
                            </div>
                        </div>
                        <Radio
                            name="update-assistant-mode"
                            value={mode}
                            checked={isSelected}
                            onChange={(checked) => checked && selectMode(mode)}
                            testId={`update-assistant-mode-${mode}-radio`}
                        />
                    </div>
                )
            })}
        </div>
    )
}
