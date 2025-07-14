package com.becon.opencelium.backend.execution.logger.enums;

public interface LogLineStage {
    String name(); // already exists on Enum
    LogLineType getStageType(); // PHASE or SEGMENT
//    LogLineStage fromString(String phase);
}
