package com.becon.opencelium.backend.unit.execution.logger.builder.strategies;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogGlobalSnapshotEntry;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.builder.strategies.DefaultPhaseBuilderFactory;
import com.becon.opencelium.backend.execution.logger.builder.strategies.ExecutionLogDataBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import java.util.HashMap;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ExecutionLogDataBuilder}: how the {@code GLOBAL_SNAPSHOT} segments of the
 * execution phase become the global snapshot of the run's log element.
 *
 * <p>The builder is taken from {@link DefaultPhaseBuilderFactory}, the way the execution tracker
 * gets it, so these tests also hold it to its registration for the EXECUTION phase.
 *
 * <p>Run with: ./gradlew test --tests "*.ExecutionLogDataBuilderTest" -x generateProto
 */
@DisplayName("ExecutionLogDataBuilder — unit")
class ExecutionLogDataBuilderTest {

    private final PhaseBuilder builder = new DefaultPhaseBuilderFactory().getBuilder(PhaseCategory.EXECUTION);

    @Test
    @DisplayName("build — the snapshot is unset, not empty, while the execution is still going")
    void buildLeavesSnapshotUnsetWhenPhaseIsPending() {
        PhaseContext context = anExecutionPhase(PhaseStatus.PENDING);
        context.addSegment(aSnapshotSegment("idoitUrl", "4", "\"https://cmdb.example\""));

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot()).isNull();
    }

    @Test
    void buildCollectsSnapshotWhenPhaseIsComplete() {
        PhaseContext context = anExecutionPhase(PhaseStatus.COMPLETE);
        context.addSegment(aSnapshotSegment("idoitApiKey", "2", "\"••••\""));
        SegmentContext omitted = new SegmentContext(SegmentType.GLOBAL_SNAPSHOT);
        omitted.addProperty(LogLineKey.NAME, "tenantMap");
        omitted.addProperty(LogLineKey.VERSION, "7");
        omitted.addProperty(LogLineKey.SIZE, "70321");
        context.addSegment(omitted);

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot())
                .extracting(LogGlobalSnapshotEntry::getName, LogGlobalSnapshotEntry::getVersion,
                        LogGlobalSnapshotEntry::getValue, LogGlobalSnapshotEntry::getSize)
                .containsExactly(
                        tuple("idoitApiKey", 2L, "\"••••\"", null),
                        tuple("tenantMap", 7L, null, 70321L));
    }

    @Test
    @DisplayName("build — an execution that fails keeps the snapshot it read")
    void buildCollectsSnapshotWhenPhaseFails() {
        PhaseContext context = anExecutionPhase(PhaseStatus.FAIL);
        context.addSegment(aSnapshotSegment("idoitUrl", "4", "\"https://cmdb.example\""));

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot())
                .extracting(LogGlobalSnapshotEntry::getName)
                .containsExactly("idoitUrl");
    }

    @Test
    void buildReturnsEmptySnapshotWhenRunReadNoVariable() {
        PhaseContext context = anExecutionPhase(PhaseStatus.COMPLETE);

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("build — skips the free-text names@versions line that older runs logged")
    void buildSkipsSegmentWhenItHasNoName() {
        PhaseContext context = anExecutionPhase(PhaseStatus.COMPLETE);
        SegmentContext freeText = new SegmentContext(SegmentType.GLOBAL_SNAPSHOT);
        freeText.addProperty(LogLineKey.DATA, "[idoitUrl@4, limit@2]");
        context.addSegment(freeText);
        context.addSegment(aSnapshotSegment("limit", "2", "50"));

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot())
                .extracting(LogGlobalSnapshotEntry::getName)
                .containsExactly("limit");
    }

    @Test
    @DisplayName("build — a version the logger hid as a secret text is left unset, the entry kept")
    void buildLeavesVersionUnsetWhenVersionIsHidden() {
        PhaseContext context = anExecutionPhase(PhaseStatus.COMPLETE);
        context.addSegment(aSnapshotSegment("idoitUrl", "****", "\"https://cmdb.example\""));

        LogDataMng logData = builder.build(context, "1", null, 1L);

        assertThat(logData.getGlobalSnapshot())
                .extracting(LogGlobalSnapshotEntry::getName, LogGlobalSnapshotEntry::getVersion)
                .containsExactly(tuple("idoitUrl", null));
    }

    private static PhaseContext anExecutionPhase(PhaseStatus status) {
        ParsedLogLine start = new ParsedLogLine(LogLineType.PHASE);
        start.setStage(PhaseType.EXECUTION_START);
        start.setStartOffset(0L);
        start.setEndOffset(60L);
        start.setProperties(new HashMap<>());

        PhaseContext context = new PhaseContext(start);
        context.setStatus(status);
        return context;
    }

    private static SegmentContext aSnapshotSegment(String name, String version, String data) {
        SegmentContext segment = new SegmentContext(SegmentType.GLOBAL_SNAPSHOT);
        segment.addProperty(LogLineKey.NAME, name);
        segment.addProperty(LogLineKey.VERSION, version);
        segment.addProperty(LogLineKey.DATA, data);
        return segment;
    }
}
