import type { EnhancementArgsProps } from './EnhancementArgs.types';
import { EnhancementArgLine } from './EnhancementArgLine';
import { useEnhancementArgs } from './useEnhancementArgs';

export function EnhancementArgs({ enhancement }: EnhancementArgsProps) {
    const { entries, hasConnection } = useEnhancementArgs(enhancement);
    if (!hasConnection) return null;

    return (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, maxHeight: 112,
            overflowY: entries.length > 4 ? 'auto' : 'visible', paddingRight: entries.length > 4 ? 4 : 0 }}>
            {entries.map((entry) => <EnhancementArgLine key={entry.key} entry={entry} />)}
        </div>
    );
}
