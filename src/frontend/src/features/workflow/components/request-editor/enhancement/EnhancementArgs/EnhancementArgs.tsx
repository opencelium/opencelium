import type { EnhancementArgsProps } from './EnhancementArgs.types';
import { EnhancementArgLine } from './EnhancementArgLine';
import { GlobalArgLine } from './GlobalArgLine';
import { useEnhancementArgs } from './useEnhancementArgs';

export function EnhancementArgs({ enhancement }: EnhancementArgsProps) {
    const { rows, hasConnection } = useEnhancementArgs(enhancement);
    if (!hasConnection) return null;

    return (
        <div data-testid='workflow-enhancement-variables'
            style={{ fontFamily: "Inter, sans-serif", fontSize: 14, maxHeight: 112,
            overflowY: rows.length > 4 ? 'auto' : 'visible', paddingRight: rows.length > 4 ? 4 : 0 }}>
            {rows.map((row) => row.kind === 'method'
                ? <EnhancementArgLine key={row.entry.key} entry={row.entry} />
                : <GlobalArgLine key={row.entry.key} entry={row.entry} />)}
        </div>
    );
}
