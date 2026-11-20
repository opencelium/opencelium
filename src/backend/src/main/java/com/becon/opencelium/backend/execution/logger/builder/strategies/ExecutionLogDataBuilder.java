package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogGlobalSnapshotEntry;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.List;
import java.util.Optional;

/**
 * Builds the log data of the EXECUTION phase: what {@link DefaultLogDataBuilder} builds, plus the
 * global variable snapshot the run read, from its {@code GLOBAL_SNAPSHOT} segments.
 *
 * <p>The snapshot lines follow {@code EXECUTION_START}, so the snapshot is complete only once the
 * execution phase has closed or failed. While it is pending the snapshot is left unset rather
 * than empty: an empty snapshot means the run read no global variable.
 */
public class ExecutionLogDataBuilder implements PhaseBuilder {
    private final PhaseBuilder defaultBuilder = new DefaultLogDataBuilder();

    @Override
    public LogDataMng build(PhaseContext context, String execId, String flowId, Long connId) {
        LogDataMng logData = defaultBuilder.build(context, execId, flowId, connId);
        if (context.getStatus() != PhaseStatus.PENDING) {
            logData.setGlobalSnapshot(toGlobalSnapshot(context.getSegments()));
        }

        return logData;
    }

    private static List<LogGlobalSnapshotEntry> toGlobalSnapshot(List<SegmentContext> segments) {
        return segments.stream()
                .filter(segment -> segment.getSegmentType() == SegmentType.GLOBAL_SNAPSHOT)
                .map(ExecutionLogDataBuilder::toEntry)
                .flatMap(Optional::stream)
                .toList();
    }

    /**
     * Reads one segment; one without a name is skipped, such as the free-text line of names and
     * versions that runs logged before the snapshot had its own entries.
     */
    private static Optional<LogGlobalSnapshotEntry> toEntry(SegmentContext segment) {
        String name = segment.getProperty(LogLineKey.NAME);
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new LogGlobalSnapshotEntry(
                name,
                parseLong(segment.getProperty(LogLineKey.VERSION)).orElse(null),
                segment.getProperty(LogLineKey.DATA),
                parseLong(segment.getProperty(LogLineKey.SIZE)).orElse(null)));
    }

    private static Optional<Long> parseLong(String text) {
        if (text == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.valueOf(text.trim()));
        } catch (NumberFormatException e) {
            // the logger hides the texts of secrets in every line, a number among them
            return Optional.empty();
        }
    }
}
