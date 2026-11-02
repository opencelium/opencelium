import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Connection, MethodWithId } from '../../types/connection';
import type { ReferenceLocation } from '../../utils/graph.referenceLocations';
import { normalizeReferenceColor } from '../../utils/graph.referenceColors';
import { parseEnhancementArg } from '../request-editor/utils/parseEnhancementArg';
import { MethodColorDot } from '../MethodColorDot/MethodColorDot';

type Props = {locations: ReferenceLocation[]; connection: Connection};

export function ReferenceRemapUsageList({locations, connection}: Props) {
    const {t} = useI18n('workflow');
    const groups = new Map<string, {method?: MethodWithId; locations: ReferenceLocation[]}>();
    locations.forEach((location) => {
        const parsed = location.kind === 'reference' ? parseEnhancementArg(location.value) : null;
        const nodeId = location.kind === 'label' ? location.url?.nodeId
            : location.kind === 'operator' ? location.nodeId : undefined;
        const method = connection.fromConnector.method.find((item) => nodeId ? item.id === nodeId
            : parsed && normalizeReferenceColor(item.color) === normalizeReferenceColor(parsed.color));
        const key = method?.id ?? nodeId ?? parsed?.color ?? 'other';
        const group = groups.get(key) ?? {method, locations: []};
        group.locations.push(location);
        groups.set(key, group);
    });
    const describe = (location: ReferenceLocation) => {
        if (location.kind === 'reference') {
            const parsed = parseEnhancementArg(location.value);
            if (parsed) return <>
                <span>{t(`conditionBuilder.responseType.${parsed.messageProperty}`)}</span>
                <span aria-hidden='true'>→</span>
                <code>{parsed.path || t('references.rootObject')}</code>
            </>;
        }
        if (location.kind === 'label' && location.url?.part === 'query') return <>
            <span>{t('referenceRemap.query')}</span><span aria-hidden='true'>→</span>
            <code>{location.url.name}</code>
        </>;
        return <span>{location.kind === 'label' && (location.url || location.value === 'url')
            ? t('contextMenu.url') : location.value}</span>;
    };
    return <div className='referenceRemapUsageList'>
        {[...groups].map(([key, group]) => {
            const urls = group.locations.filter((location) => location.kind === 'label' && location.url);
            return <div className='referenceRemapUsageGroup' key={key}>
                {group.method && <div className='referenceRemapUsageMethod'>
                    <MethodColorDot color={group.method.color} size={8} />
                    <strong>{group.method.label || group.method.name}</strong>
                </div>}
                <ul className='referenceRemapUsageItems'>
                    {group.locations.map((location, index) =>
                        <li key={index} className='referenceRemapUsageItem'>{describe(location)}</li>)}
                </ul>
                {urls.length > 0 && <details className='referenceRemapUsageDetails'>
                    <summary>{t('referenceRemap.details')}</summary>
                    {urls.map((location, index) => <div key={index}>
                        <div className='referenceRemapUsageItem'>{describe(location)}</div>
                        <code className='referenceRemapUrlValue'>{location.value}</code>
                    </div>)}
                </details>}
            </div>;
        })}
    </div>;
}
