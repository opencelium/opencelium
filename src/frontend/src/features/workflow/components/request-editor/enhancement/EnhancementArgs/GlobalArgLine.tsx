import { Trans } from 'react-i18next';
import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import { useGlobalReferenceInfo } from '@entities/globalVariable/ui/picker/useGlobalReferenceInfo';
import { ReferenceChip } from '../../../reference-chip/ReferenceChip';
import { GLOBAL_CHIP_COLOR } from '../../../reference-chip/referenceChip.utils';
import { useReferenceSourceLabels } from '../../../reference-chip/ReferenceSourceContext';
import type { GlobalArgEntry } from './EnhancementArgs.types';

// Trans hands the translated name in as children; the chip shows the name itself, so they are ignored.
function GlobalArgChip({ reference }: { reference: string; children?: unknown }) {
    const info = useGlobalReferenceInfo(reference);
    const { global } = useReferenceSourceLabels();
    return <ReferenceChip color={GLOBAL_CHIP_COLOR} source={global} path={info?.label ?? reference}
        title={info?.detail} tone={info?.isUnknown ? 'error' : 'default'} testId='global-reference-chip' />;
}

export function GlobalArgLine({ entry }: { entry: GlobalArgEntry }) {
    const { items } = useGlobalVariablePicker();
    const name = parseGlobalReference(entry.reference)?.name;
    const isScript = items.some((item) => item.kind === 'SCRIPT' && item.name === name);
    return <div style={{ marginBottom: 6 }} data-testid={`workflow-enhancement-variable-${entry.key}`}>
        <strong>{entry.key}</strong>{' '}
        <span style={{ opacity: 0.7 }}><Trans ns="workflow"
            i18nKey={isScript ? 'args.callsGlobalScript' : 'args.takenFromGlobal'}
            values={{ name, key: entry.key }}
            components={{ global: <GlobalArgChip reference={entry.reference} /> }} /></span>
    </div>;
}
