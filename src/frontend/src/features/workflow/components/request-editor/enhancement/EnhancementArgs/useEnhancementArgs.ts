import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import type { RootState } from '../../../../store';
import type { EnhancementArgsProps, ParsedArgEntry } from './EnhancementArgs.types';

export function useEnhancementArgs(enhancement: EnhancementArgsProps['enhancement']) {
    const connection = useSelector((state: RootState) => state.connection.connection);
    const methods = connection?.fromConnector.method || [];

    const entries = useMemo<ParsedArgEntry[]>(() => Object.entries(enhancement.args || {})
        .map(([key, value]) => {
            const parsed = parseEnhancementArg(value);
            if (!parsed) return null;
            const method = methods.find(
                (candidate) => candidate.color.toLowerCase() === parsed.color.toLowerCase(),
            ) || null;
            return {
                key,
                path: parsed.path,
                color: parsed.color,
                methodName: method?.label || method?.name || String(method?.index ?? 'UnknownMethod'),
                direction: parsed.direction,
                messageProperty: parsed.messageProperty,
            };
        })
        .filter(Boolean) as ParsedArgEntry[], [enhancement.args, methods]);

    return { entries, hasConnection: Boolean(connection) };
}
