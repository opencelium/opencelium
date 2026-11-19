import { Tag } from 'antd'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { DetectedRef } from '../../model/script'

export function ScriptRefsList({ refs }: { refs: DetectedRef[] }) {
    const { t } = useI18n('entities')
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} data-testid="global-variable-script-refs">
            <Typography variant="label" isSubtle>{t('global-variable.script.refs.title')}</Typography>
            {refs.length === 0
                ? <Typography variant="caption" isSubtle>{t('global-variable.script.refs.none')}</Typography>
                : refs.map((ref) => (
                    <div key={ref.ref} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Tag>{t(`global-variable.script.refs.type.${ref.type}`)}</Tag>
                        <code style={{ overflowWrap: 'anywhere' }}>{ref.ref}</code>
                        {ref.warning && (
                            <Tag color="warning">{t('global-variable.script.warnings.TIED_TO_CALLER_COLORS')}</Tag>
                        )}
                    </div>
                ))}
        </div>
    )
}
