import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import { Trans } from "react-i18next";
import {parseEnhancementArg} from "../utils/parseEnhancementArg";
import type { Enhancement } from "../../../types/connection";
import type { RootState } from "../../../store";
import { useI18n } from "@shared/i18n/hooks/useI18n";

interface EnhancementArgsProps {
    enhancement: Enhancement;
}

interface ParsedArgEntry {
    key: string;
    path: string;
    color: string;
    methodName: string;
    direction: 'request' | 'response';
    messageProperty: string;
}

export const EnhancementArgs: React.FC<EnhancementArgsProps> = ({ enhancement }) => {
    const { t } = useI18n('workflow');
    const connection = useSelector((state: RootState) => state.connection.connection);

    const methods = connection?.fromConnector.method || [];

    const parsedEntries = useMemo<ParsedArgEntry[]>(() => {
        const args = enhancement.args || {};

        return Object.entries(args)
            .map(([key, value]) => {
                const parsed = parseEnhancementArg(value);
                if (!parsed) return null;

                const method =
                    methods.find((m) => m.color.toLowerCase() === parsed.color.toLowerCase()) ||
                    null;

                return {
                    key,
                    path: parsed.path,
                    color: parsed.color,
                    methodName: method?.label || method?.name || String(method?.index ?? "UnknownMethod"),
                    direction: parsed.direction,
                    messageProperty: parsed.messageProperty,
                };
            })
            .filter(Boolean) as ParsedArgEntry[];
    }, [enhancement.args, methods]);

    const getLocationLabel = (entry: ParsedArgEntry): string => {
        if (entry.direction === 'response') {
            if (entry.messageProperty === 'body') return t('args.locations.responseBody');
            if (entry.messageProperty === 'header') return t('args.locations.responseHeader');
            return entry.messageProperty;
        }
        switch (entry.messageProperty) {
            case 'body': return t('args.locations.requestBody');
            case 'header': return t('args.locations.requestHeader');
            case 'endpoint': return t('args.locations.requestUrl');
            case 'status': return t('args.locations.responseStatus');
            default: return entry.messageProperty;
        }
    };

    const renderMethodBadge = (entry: ParsedArgEntry) => (
        <span
            style={{
                backgroundColor: entry.color,
                color: 'var(--color-text-on-action)',
                borderRadius: 4,
                padding: '2px 6px',
                fontWeight: 600,
                opacity: 1,
            }}
        >
            {entry.methodName}
        </span>
    );

    const stripRootPath = (path: string) =>
        String(path || '')
            .replace(/\.$/, '')
            .replace(/^\$\./, '')
            .replace(/^\$/, '');

    const getFieldName = (entry: ParsedArgEntry) => {
        const fieldName = stripRootPath(entry.path);
        if (!fieldName && (entry.messageProperty === 'body' || entry.messageProperty === 'header')) {
            return `${entry.messageProperty}.$`;
        }
        return fieldName;
    };

    const renderSourceDescription = (entry: ParsedArgEntry) => {
        if (entry.direction === 'response' && entry.messageProperty === 'status') {
            return (
                <span style={{ opacity: 0.7 }}>
                    <Trans
                        ns="workflow"
                        i18nKey="args.fromResponseStatus"
                        values={{ method: entry.methodName }}
                        components={{ method: renderMethodBadge(entry) }}
                    />
                </span>
            );
        }

        const fieldName = getFieldName(entry);
        const location = getLocationLabel(entry);

        return (
            <span style={{ opacity: 0.7 }}>
                <Trans
                    ns="workflow"
                    i18nKey={entry.key === 'RESULT_VAR' ? 'args.usedAsField' : 'args.takenFromField'}
                    values={{ field: fieldName, location, method: entry.methodName }}
                    components={{
                        field: <span style={{ color: entry.color, fontWeight: 500, opacity: 1 }} />,
                        method: renderMethodBadge(entry),
                    }}
                />
            </span>
        );
    };

    const renderArgLine = (entry: ParsedArgEntry) => {
        return (
            <div key={entry.key} style={{ marginBottom: 6 }}>
                <strong>{entry.key}</strong>{' '}
                {renderSourceDescription(entry)}
            </div>
        );
    };
    if (!connection) return null;

    return (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, maxHeight: 112, overflowY: parsedEntries.length > 4 ? 'auto' : 'visible', paddingRight: parsedEntries.length > 4 ? 4 : 0 }}>
            {parsedEntries.map(renderArgLine)}
        </div>
    );
};
