
package com.becon.opencelium.backend.execution.log_managing.trackers;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.util.HashMap;
import java.util.Map;

public class LoopTracker implements LogElementTracker {
    private String indexPath;
    private long startOffset;
    private Map<String, Object> meta;

    @Override
    public void onStart(ParsedLogLine line, long startOffset) {
        this.startOffset = startOffset;
        this.indexPath = line.getIndexPath();
        this.meta = new HashMap<>(line.getProperties());
    }

    @Override
    public void onContent(ParsedLogLine line) {
    }

    @Override
    public LogMetaData onEnd(ParsedLogLine line) {
        LogMetaData metaData = new LogMetaData();
        metaData.setIndexPath(indexPath);
        metaData.setStartOffset(startOffset);
        metaData.setType("loop");
        metaData.setMeta(meta);
        return metaData;
    }
}
