/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Object mother for {@link LogDataMng} test data.
 *
 * Use the named factory methods in test classes — never construct
 * LogDataMng objects inline. Add new named scenarios here rather than
 * duplicating setup across test classes.
 */
public final class LogDataMngFixture {

    private LogDataMngFixture() {}

    /**
     * an empty LogDataMng for non-existing elementId
     */
    public static Optional<LogDataMng> anEmptyLogData() {
        return Optional.empty();
    }

    /**
     * LogDataMng for execution phase = FLOWCHART
     * and status = COMPLETE.
     */
    public static LogDataMng aFlowchartPhaseLogData() {
        LogDataMng entity = new LogDataMng();

        entity.setId("69fac335ee4ea82b347c51ed");

        entity.setConnectionId(1L);
        entity.setExecutionId("1");
        entity.setFlowId("c9cda068-f8ef-49c5-8325-2be20ca2bf6a");
        entity.setConnectorName("Fake api");

        entity.setStatus(PhaseStatus.COMPLETE);
        entity.setStartOffset(83L);
        entity.setEndOffset(14411474L);

        entity.setLogLineType(LogLineType.PHASE);
        entity.setType(PhaseCategory.FLOWCHART);

        Map<String, Object> properties = new HashMap<>();
        properties.put("DIRECTION", "source");
        properties.put("CONNECTOR_ID", "1");

        entity.setProperties(properties);
        entity.setSegments(new HashMap<>());

        entity.setCreatedAt(Instant.parse("2026-05-06T04:31:57.256Z"));

        return entity;
    }

    /**
     * LogDataMng for execution phase = EXECUTION and status = COMPLETE.
     * Buffering this block marks the execution as finished and triggers
     * a full flush of the log block buffer.
     */
    public static LogDataMng anExecutionCompletePhaseLogData() {
        LogDataMng entity = new LogDataMng();

        entity.setId("69fac335ee4ea82b347c51ef");

        entity.setConnectionId(1L);
        entity.setExecutionId("1");
        // own flow id so the block never merges with buffered flowchart blocks
        entity.setFlowId("7d3a1f42-9b0c-4e6d-8a15-0fe27ca2bf6b");

        entity.setStatus(PhaseStatus.COMPLETE);
        entity.setStartOffset(0L);
        entity.setEndOffset(14411474L);

        entity.setLogLineType(LogLineType.PHASE);
        entity.setType(PhaseCategory.EXECUTION);

        entity.setProperties(new HashMap<>());
        entity.setSegments(new HashMap<>());

        entity.setCreatedAt(Instant.parse("2026-05-06T04:31:58.000Z"));

        return entity;
    }

    /**
     * LogDataMng for operation phase = OPERATION
     * and status = COMPLETE.
     */
    public static LogDataMng anOperationPhaseLogData() {
        LogDataMng entity = new LogDataMng();

        entity.setId("69fac335ee4ea82b347c51ee");

        entity.setConnectionId(1L);
        entity.setExecutionId("1");
        entity.setFlowId("c9cda068-f8ef-49c5-8325-2be20ca2bf6a");

        entity.setStatus(PhaseStatus.COMPLETE);
        entity.setIndexPath("0");
        entity.setStartOffset(230L);
        entity.setEndOffset(11828L);

        entity.setLogLineType(LogLineType.PHASE);
        entity.setType(PhaseCategory.OPERATION);

        entity.setProperties(new HashMap<>());
        entity.setSegments(new HashMap<>());

        entity.setCreatedAt(Instant.parse("2026-05-06T04:27:33.460Z"));

        return entity;
    }
}
