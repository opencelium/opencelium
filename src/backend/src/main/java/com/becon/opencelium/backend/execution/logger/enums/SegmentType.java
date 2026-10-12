package com.becon.opencelium.backend.execution.logger.enums;

public enum SegmentType implements LogLineStage {
    // SEGMENT values
    REQUEST,
    REQUEST_HEADER,
    REQUEST_PAYLOAD,
    RESPONSE,
    RESPONSE_HEADER,
    RESPONSE_PAYLOAD,
    IF_REF,
    IF_RESULT,
    LOOP_REF,
    REF_NOT_FOUND, // a reference whose data was never produced; execution continues
    EXCEPTION;


    public static SegmentType fromString(String segment) {
        for (SegmentType v : values()) {
            if (v.name().equalsIgnoreCase(segment)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Segment type: " + segment);
    }

    public static boolean containsFromString(String segment) {
        for (SegmentType v : values()) {
            if (v.name().equalsIgnoreCase(segment)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public LogLineType getStageType() {
        return LogLineType.SEGMENT;
    }
}
