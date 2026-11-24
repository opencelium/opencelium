import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import type { RootState } from '../../../../store';
import type { ArgRow, EnhancementArgsProps, ParsedArgEntry } from './EnhancementArgs.types';

export function useEnhancementArgs(enhancement: EnhancementArgsProps['enhancement']) {
    const connection = useSelector((state: RootState) => state.connection.connection);
    const methods = connection?.fromConnector.method || [];

    const rows = useMemo<ArgRow[]>(() => Object.entries(enhancement.args || {})
        .flatMap(([key, value]): ArgRow[] => {
            if (isGlobalReference(value)) return [{ kind: 'global', entry: { key, reference: value.trim() } }];
            const parsed = parseEnhancementArg(value);
            if (!parsed) return [];
            const method = methods.find(
                (candidate) => candidate.color.toLowerCase() === parsed.color.toLowerCase(),
            ) || null;
            return [{ kind: 'method', entry: {
                key,
                path: parsed.path,
                color: parsed.color,
                methodName: method?.label || method?.name || String(method?.index ?? 'UnknownMethod'),
                direction: parsed.direction,
                messageProperty: parsed.messageProperty,
            } }];
        }), [enhancement.args, methods]);
    const entries = useMemo<ParsedArgEntry[]>(
        () => rows.flatMap((row) => (row.kind === 'method' ? [row.entry] : [])), [rows]);

    return { rows, entries, hasConnection: Boolean(connection) };
}
