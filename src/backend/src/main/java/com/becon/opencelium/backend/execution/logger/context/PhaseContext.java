package com.becon.opencelium.backend.execution.logger.context;

import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PhaseContext {
    private final ParsedLogLine parsedLogLine;
    private final long startOffset;
    private long endOffset;
    private PhaseStatus status;
    private final List<SegmentContext> segments = new ArrayList<>();
    private ErrorDetail errorDetail;
//    private final List<Context> children = new ArrayList<>();

    public PhaseContext(ParsedLogLine parsedLogLine) {
        ParsedLogLine cloned = new ParsedLogLine(parsedLogLine.getType());
        cloned.setStartOffset(parsedLogLine.getStartOffset());
        cloned.setEndOffset(parsedLogLine.getEndOffset());
        cloned.setStage(parsedLogLine.getStage()); // assuming LogLineStage is an enum or immutable
        cloned.setType(parsedLogLine.getType());
        cloned.setProperties(new HashMap<>());
        cloned.setRawLogLine(parsedLogLine.getRawLogLine());
        this.parsedLogLine = cloned;
        this.endOffset = parsedLogLine.getEndOffset();
        this.startOffset = parsedLogLine.getStartOffset();
    }

    public ParsedLogLine getParsedLogLine() {
        return parsedLogLine;
    }

    public PhaseStatus getStatus() {
        return status;
    }

    public void setStatus(PhaseStatus status) {
        this.status = status;
    }

    public long getStartOffset() {
        return startOffset;
    }

    public void setEndOffset(long endOffset) {
        this.endOffset = endOffset;
    }

    public long getEndOffset() {
        return endOffset;
    }

    public Map<LogLineKey, String> getProperties() {
        return this.parsedLogLine.getProperties();
    }

    public void addProperty(LogLineKey key, String value) {
        this.parsedLogLine.getProperties().put(key, value);
    }

    public List<SegmentContext> getSegments() {
        return segments;
    }

    /** Add a segment (e.g., REQUEST, RESPONSE) if in FULL mode. */
    public void addSegment(SegmentContext seg) {
        segments.add(seg);
    }

    public String getProperty(LogLineKey key) {
        return parsedLogLine.getProperties().get(key);
    }

    public ErrorDetail getErrorDetail() {
        return errorDetail;
    }

    public void setErrorDetail(ErrorDetail errorDetail) {
        this.errorDetail = errorDetail;
    }

    //    public List<PhaseContext> getChildren() {
//        return children;
//    }

//    /** Add a nested child context (e.g., a loop inside an operation). */
//    public void addChild(Context child) {
//        children.add(child);
//    }


}
