import React from 'react'
import { Tag } from 'antd'
import { Icon } from '@shared/ui/primitives/Icon'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableKind } from '../model/types'

// Antd preset colours adapt to the dark algorithm, so the badge needs no theme tokens of its own.
const KIND_LOOK: Record<GlobalVariableKind, { icon: IconName; color: string }> = {
    CONSTANT: { icon: 'lock', color: 'default' },
    MUTABLE: { icon: 'refresh', color: 'gold' },
    SCRIPT: { icon: 'code', color: 'purple' },
}

type Props = {
    kind: GlobalVariableKind
    isIconOnly?: boolean
}

export const GlobalVariableKindBadge: React.FC<Props> = ({ kind, isIconOnly = false }) => {
    const { t } = useI18n('entities')
    const { icon, color } = KIND_LOOK[kind]
    const label = t(`global-variable.kind.${kind}.label`)
    const tag = (
        <Tag
            color={color}
            icon={<Icon name={icon} size={12} />}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0 }}
            data-testid={`global-variable-kind-${kind.toLowerCase()}`}
        >
            {isIconOnly ? null : label}
        </Tag>
    )
    return (
        <Tooltip content={t(`global-variable.kind.${kind}.hint`)} placement="top">
            {tag}
        </Tooltip>
    )
}
