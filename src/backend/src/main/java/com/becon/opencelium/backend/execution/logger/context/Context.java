package com.becon.opencelium.backend.execution.logger.context;

import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Context {
    private final LogLineStage stage;
    private final Map<String, String> startProps = new HashMap<>();
    private final List<ParsedLogLine> segments = new ArrayList<>();
//    private final List<Context> children = new ArrayList<>();

    protected Context(LogLineStage stage) {
        this.stage = stage;
    }

    public LogLineStage getStartType() {
        return stage;
    }

    public Map<String, String> getStartProps() {
        return startProps;
    }

    public List<Context> getChildren() {
        return children;
    }

    public List<Segment> getSegments() {
        return segments;
    }

//    /** Add a nested child context (e.g., a loop inside an operation). */
//    public void addChild(Context child) {
//        children.add(child);
//    }

    /** Add a segment (e.g., REQUEST, RESPONSE) if in FULL mode. */
    public void addSegment(Segment seg) {
        segments.add(seg);
    }
}
