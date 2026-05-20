import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import {parseEnhancementArg} from "../utils/parseEnhancementArg";
import type { Enhancement } from "../../../types/connection";
import type { RootState } from "../../../store";

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
                    methodName: method?.name || "UnknownMethod",
                    direction: parsed.direction,
                    messageProperty: parsed.messageProperty,
                };
            })
            .filter(Boolean) as ParsedArgEntry[];
    }, [enhancement.args, methods]);

    const humanizeMessageProperty = (messageProperty: string) => {
        if (messageProperty === 'body') return 'request body';
        if (messageProperty === 'header') return 'request header';
        if (messageProperty === 'endpoint') return 'request url';
        if (messageProperty === 'status') return 'response status';
        return messageProperty;
    };

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
                <>
                    <span style={{ opacity: 0.7 }}>is taken from</span>{' '}
                    <span style={{ opacity: 0.7 }}>response status of the</span>{' '}
                    <span
                        style={{
                            backgroundColor: entry.color,
                            color: "white",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontWeight: 600,
                        }}
                    >
                        {entry.methodName}
                    </span>{' '}
                    <span style={{ opacity: 0.7 }}>method.</span>
                </>
            );
        }

        const fieldName = getFieldName(entry);
        const locationLabel =
            entry.direction === 'response'
                ? entry.messageProperty === 'body'
                    ? 'response body'
                    : entry.messageProperty === 'header'
                    ? 'response header'
                    : entry.messageProperty
                : humanizeMessageProperty(entry.messageProperty);

        if (entry.key === 'RESULT_VAR') {
            return (
                <>
                    <span style={{ opacity: 0.7 }}>is used as the value of the</span>{' '}
                    <span style={{ color: entry.color, fontWeight: 500 }}>{fieldName}</span>{' '}
                    <span style={{ opacity: 0.7 }}>field in the</span>{' '}
                    <span style={{ opacity: 0.7 }}>{locationLabel} of the</span>{' '}
                    <span
                        style={{
                            backgroundColor: entry.color,
                            color: "white",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontWeight: 600,
                        }}
                    >
                        {entry.methodName}
                    </span>{' '}
                    <span style={{ opacity: 0.7 }}>method.</span>
                </>
            );
        }

        return (
            <>
                <span style={{ opacity: 0.7 }}>is taken from the value of the</span>{' '}
                <span style={{ color: entry.color, fontWeight: 500 }}>{fieldName}</span>{' '}
                <span style={{ opacity: 0.7 }}>field in the</span>{' '}
                <span style={{ opacity: 0.7 }}>{locationLabel} of the</span>{' '}
                <span
                    style={{
                        backgroundColor: entry.color,
                        color: "white",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontWeight: 600,
                    }}
                >
                    {entry.methodName}
                </span>{' '}
                <span style={{ opacity: 0.7 }}>method.</span>
            </>
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
