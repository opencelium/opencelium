import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip';
import type { ParsedArgEntry } from './EnhancementArgs.types';
import { argLocation } from './argLocation';

export function EnhancementArgLine({ entry }: { entry: ParsedArgEntry }) {
    const { t } = useI18n('workflow');
    const isStatus = entry.direction === 'response' && entry.messageProperty === 'status';
    const { locationKey, field } = argLocation(entry);
    const chip = <ReferenceChip color={entry.color} source={entry.methodName} path={isStatus ? 'status' : field}
        testId={`workflow-enhancement-variable-chip-${entry.key}`} />;
    const i18nKey = isStatus ? 'args.fromResponseStatus'
        : entry.key === 'RESULT_VAR' ? 'args.usedAsField' : 'args.takenFromField';

    return <div style={{ marginBottom: 6 }}><strong>{entry.key}</strong>{' '}
        <span style={{ opacity: 0.7 }}><Trans ns="workflow" i18nKey={i18nKey}
            values={{ location: t(locationKey) }} components={{ ref: chip }} /></span>
    </div>;
}
