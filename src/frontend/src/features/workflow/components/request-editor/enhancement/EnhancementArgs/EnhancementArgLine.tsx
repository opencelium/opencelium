import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ParsedArgEntry } from './EnhancementArgs.types';
import { argLocation } from './argLocation';

export function EnhancementArgLine({ entry }: { entry: ParsedArgEntry }) {
    const { t } = useI18n('workflow');
    const methodBadge = (
        <span style={{ backgroundColor: entry.color, color: 'var(--color-text-on-action)',
            borderRadius: 4, padding: '2px 6px', fontWeight: 600, opacity: 1 }}>
            {entry.methodName}
        </span>
    );

    if (entry.direction === 'response' && entry.messageProperty === 'status') {
        return <div style={{ marginBottom: 6 }}><strong>{entry.key}</strong>{' '}
            <span style={{ opacity: 0.7 }}><Trans ns="workflow" i18nKey="args.fromResponseStatus"
                values={{ method: entry.methodName }} components={{ method: methodBadge }} /></span>
        </div>;
    }

    const { locationKey, field: fieldName } = argLocation(entry);
    const location = t(locationKey);

    return <div style={{ marginBottom: 6 }}><strong>{entry.key}</strong>{' '}
        <span style={{ opacity: 0.7 }}><Trans ns="workflow"
            i18nKey={entry.key === 'RESULT_VAR' ? 'args.usedAsField' : 'args.takenFromField'}
            values={{ field: fieldName, location, method: entry.methodName }} components={{
                field: <span style={{ color: entry.color, fontWeight: 500, opacity: 1 }} />,
                method: methodBadge,
            }} /></span>
    </div>;
}
