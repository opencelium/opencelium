package com.becon.opencelium.backend.execution.logger.context;

import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import java.util.ArrayList;
import java.util.List;

public class Context {
    private final ParsedLogLine logLine;
    private final List<ParsedLogLine> segments = new ArrayList<>();
    private final List<Context> children = new ArrayList<>();

    protected Context(ParsedLogLine logLine) {
        this.logLine = logLine;
    }

    public List<ParsedLogLine> getSegments() {
        return segments;
    }

    public List<Context> getChildren() {
        return children;
    }

    public void addSegment(ParsedLogLine segLine) {
        if (segLine.getLogLineType() != LogLineType.PHASE) {
            System.out.println("You are trying to add phase");
            return;
        }
        segments.add(segLine);
    }

    public void addChild(Context child) {
        children.add(child);
    }
}
