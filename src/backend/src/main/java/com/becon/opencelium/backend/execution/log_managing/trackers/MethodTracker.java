package com.becon.opencelium.backend.execution.log_managing.trackers;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.*;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class MethodTracker implements LogElementTracker {
    private String indexPath;
    private long startOffset;
    private Map<String, Object> meta;

    private final Set<LogEntryType> seenParts = EnumSet.noneOf(LogEntryType.class);
    private StringBuilder data;
    private boolean isDataWanted;

    private static final EnumSet<LogEntryType> REQUIRED_PARTS = EnumSet.of(
            LogEntryType.REQUEST,
            LogEntryType.REQUEST_HEADER,
            LogEntryType.REQUEST_PAYLOAD,
            LogEntryType.RESPONSE,
            LogEntryType.RESPONSE_HEADER,
            LogEntryType.RESPONSE_PAYLOAD
    );

    @Override
    public void onStart(ParsedLogLine line, long startOffset) {
        this.startOffset = startOffset;
        this.indexPath = line.getIndexPath();
        this.meta = new HashMap<>(line.getProperties());
    }

    @Override
    public void onContent(ParsedLogLine line) {
        trackHistory(line);
        meta.putAll(line.getProperties());
    }

    @Override
    public LogMetaData onEnd(ParsedLogLine line) {
        validateComponentsBeforeBuild(line.getEntryType());
        LogMetaData metaData = new LogMetaData();
        metaData.setIndexPath(indexPath);
        metaData.setStartOffset(startOffset);
        metaData.setType("method");
        metaData.setMeta(meta);
        return metaData;
    }

    @Override
    public void onNotStructuredLine(String line) {
        if (!isDataWanted) {
            throw LogProcessingException.unsupportedLineFound(line);
        }

        data.append(line);
        Object parsed = PropertyParsers.parseData(data.toString());
        if (parsed instanceof Map<?, ?>) {
            isDataWanted = false;
            data = new StringBuilder();
        }
    }

    private void validateComponentsBeforeBuild(LogEntryType endingEntryType) {
        for (LogEntryType required : REQUIRED_PARTS) {
            if (!seenParts.contains(required)) {
                throw LogProcessingException.missingRequiredLogPart(required, endingEntryType);
            }
        }
    }

    private void trackHistory(ParsedLogLine line) {
        seenParts.add(line.getEntryType());
        if (line.getProperties().containsKey(LogPropertyKeys.DATA)) {
            Object obj = line.getProperties().get(LogPropertyKeys.DATA);
            if (obj == null) {
                isDataWanted = false;
            } else if (obj instanceof String str) {
                isDataWanted = true;
                this.data = new StringBuilder(str);
            } else {
                isDataWanted = false;
            }
            line.getProperties().remove(LogPropertyKeys.DATA);
        }
    }
}