import React from 'react';
import styled from 'styled-components';
interface LogEntry {
    timestamp: string;
    level: string;
    segment?: string;
    phase?: string;
    meta: Record<string, string>;
}

const parseLogLine = (line: string): LogEntry | null => {
    const cleanedLine = line.replace(/\r|\n/g, ' ').trim();
    const logRegex = /^([\d\-]+ [\d:.]+) (\w+)\s+(.*)$/;
    const match = cleanedLine.match(logRegex);
    if (!match) return null;


    const [, timestamp, level, rest] = match;

    const segmentMatch = rest.match(/segment=(\w+)/);
    const phaseMatch = rest.match(/phase=(\w+)/);
    const segment = segmentMatch?.[1];
    const phase = phaseMatch?.[1];

    let metaText = rest;
    if (segmentMatch) {
        const start = rest.indexOf(`segment=${segment}`) + `segment=${segment}`.length;
        metaText = rest.slice(start).trim();
    } else if (phaseMatch) {
        const start = rest.indexOf(`phase=${phase}`) + `phase=${phase}`.length;
        metaText = rest.slice(start).trim();
    }

    const meta: Record<string, string> = {};
    //if (segment) meta.segment = segment;
    //if (phase) meta.phase = phase;
    if (metaText) meta.meta = metaText;

    return { timestamp, level, segment, phase, meta };
};

function tryParseJson(value: string): any | null {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    }
    return null;
}

// --- Styled Components ---
const Container = styled.div`
  font-family: monospace;
  font-size: 14px;
`;

const LogBox = styled.div`
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
`;

const Header = styled.div`
  margin-bottom: 6px;
`;

const Timestamp = styled.span`
  color: #0366d6;
  font-weight: bold;
`;

const Level = styled.span<{ level: string }>`
  margin-left: 12px;
  color: ${({ level }) =>
    level === 'ERROR' ? '#d73a49' :
        level === 'WARN' ? '#d97706' :
            level === 'INFO' ? '#0366d6' : '#555'};
  font-weight: bold;
`;

const Phase = styled.span`
  margin-left: 12px;
  color: #0366d6;
  font-weight: bold;
`;

const MetaBlock = styled.div`
  margin-left: 12px;
`;

const MetaItem = styled.div`
  margin-top: 4px;
`;

const Key = styled.span`
  font-weight: bold;
`;

const Value = styled.pre`
  color: #222;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
`;

const LogViewer: React.FC<{ logText: string }> = ({ logText }) => {
    const parsedLogs = [logText].map(parseLogLine).filter(Boolean) as LogEntry[];
    return (
        <Container>
            {parsedLogs.map((log, idx) => (
                <LogBox key={idx}>
                    <Header>
                        <Timestamp>{log.timestamp}</Timestamp>
                        <Level level={log.level}>{log.level}</Level>
                        {log.phase && <Phase>{log.phase}</Phase>}
                        {log.segment && <Phase>{log.segment}</Phase>}
                    </Header>
                    <MetaBlock>
                        {Object.entries(log.meta).map(([key, val]) => {
                            const parsed = tryParseJson(val);
                            return (
                                <MetaItem key={key}>
                                    <Key>{key}:</Key>{' '}
                                    <Value>
                                        {parsed !== null
                                            ? JSON.stringify(parsed, null, 2)
                                            : val.replace(/^"|"$/g, '')}
                                    </Value>
                                </MetaItem>
                            );
                        })}
                    </MetaBlock>
                </LogBox>
            ))}
        </Container>
    );
};

export default LogViewer;
