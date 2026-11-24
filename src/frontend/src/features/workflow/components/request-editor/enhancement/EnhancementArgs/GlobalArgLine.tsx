import { Trans } from 'react-i18next';
import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { GlobalReferenceChip } from '@entities/globalVariable/ui/picker/GlobalReferenceChip';
import { useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import type { GlobalArgEntry } from './EnhancementArgs.types';

export function GlobalArgLine({ entry }: { entry: GlobalArgEntry }) {
    const { items } = useGlobalVariablePicker();
    const name = parseGlobalReference(entry.reference)?.name;
    const isScript = items.some((item) => item.kind === 'SCRIPT' && item.name === name);
    return <div style={{ marginBottom: 6 }} data-testid={`workflow-enhancement-variable-${entry.key}`}>
        <strong>{entry.key}</strong>{' '}
        <span style={{ opacity: 0.7 }}><Trans ns="workflow"
            i18nKey={isScript ? 'args.callsGlobalScript' : 'args.takenFromGlobal'}
            values={{ name, key: entry.key }}
            components={{ global: <GlobalReferenceChip reference={entry.reference} /> }} /></span>
    </div>;
}
