import { useState } from 'react'
import { Popover } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { buildGlobalReference } from '../../lib/globalReference'
import type { PickerScope } from '../../model/types'
import { GlobalPickerScopeProvider } from './GlobalPickerScopeProvider'
import { GlobalVariableSelect } from './GlobalVariableSelect'

type Props = {
    scope: PickerScope
    onInsert: (reference: string) => void
    disabled?: boolean
    testId: string
}

/** A globe button that offers the variables of `scope` and hands back `{{global.name}}`. */
export function GlobalVariableInsertButton({ scope, onInsert, disabled, testId }: Props) {
    const { t } = useI18n('entities')
    const [isOpen, setIsOpen] = useState(false)

    return (
        <GlobalPickerScopeProvider scope={scope}>
            <Popover
                open={isOpen}
                onOpenChange={setIsOpen}
                trigger="click"
                placement="bottomRight"
                destroyOnHidden
                content={
                    <div style={{ width: 320 }}>
                        <GlobalVariableSelect
                            popupZIndex={1100}
                            testId={`${testId}-select`}
                            onChange={(name) => {
                                onInsert(buildGlobalReference(name))
                                setIsOpen(false)
                            }}
                        />
                    </div>
                }
            >
                <span>
                    <Tooltip content={t('global-variable.picker.insert')} placement="top">
                        <IconButton
                            iconProps={{ name: 'globe' }}
                            type="text"
                            size="sm"
                            disabled={disabled}
                            testId={testId}
                        />
                    </Tooltip>
                </span>
            </Popover>
        </GlobalPickerScopeProvider>
    )
}
