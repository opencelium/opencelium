import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ParsedArgEntry } from './EnhancementArgs.types';

const stripRootPath = (path: string) => String(path || '')
    .replace(/\.$/, '').replace(/^\$\./, '').replace(/^\$/, '');

const REQUEST_LOCATION_KEYS: Record<string, string> = {
    body: 'args.locations.requestBody',
    header: 'args.locations.requestHeader',
    endpoint: 'args.locations.requestUrl',
    status: 'args.locations.responseStatus',
};

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

    const location = entry.direction === 'response'
        ? t(entry.messageProperty === 'body' ? 'args.locations.responseBody'
            : entry.messageProperty === 'header' ? 'args.locations.responseHeader' : entry.messageProperty)
        : t(REQUEST_LOCATION_KEYS[entry.messageProperty] || entry.messageProperty);
    const strippedPath = stripRootPath(entry.path);
    const fieldName = !strippedPath && ['body', 'header'].includes(entry.messageProperty)
        ? `${entry.messageProperty}.$` : strippedPath;

    return <div style={{ marginBottom: 6 }}><strong>{entry.key}</strong>{' '}
        <span style={{ opacity: 0.7 }}><Trans ns="workflow"
            i18nKey={entry.key === 'RESULT_VAR' ? 'args.usedAsField' : 'args.takenFromField'}
            values={{ field: fieldName, location, method: entry.methodName }} components={{
                field: <span style={{ color: entry.color, fontWeight: 500, opacity: 1 }} />,
                method: methodBadge,
            }} /></span>
    </div>;
}
