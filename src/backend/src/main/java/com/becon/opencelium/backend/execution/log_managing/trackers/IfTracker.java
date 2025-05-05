
package com.becon.opencelium.backend.execution.log_managing.trackers;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.util.HashMap;
import java.util.Map;

public class IfTracker implements LogElementTracker {
    private String indexPath;
    private long startOffset;
    private Map<String, Object> meta;
    private boolean isResultCame;

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
        metaData.setType("if");
        metaData.setMeta(meta);
        return metaData;
    }

    private void validateComponentsBeforeBuild(LogEntryType entryType) {
        if (!isResultCame) {
            throw LogProcessingException.missingRequiredLogPart(LogEntryType.IF_RESULT, entryType);
        }
    }

    private void trackHistory(ParsedLogLine line) {
        if (line.getEntryType() == LogEntryType.IF_RESULT) {
            isResultCame = true;
        }
    }
}
