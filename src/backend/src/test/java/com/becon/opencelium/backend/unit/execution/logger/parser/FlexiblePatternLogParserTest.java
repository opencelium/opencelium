package com.becon.opencelium.backend.unit.execution.logger.parser;

import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;

import com.becon.opencelium.backend.execution.globalvariable.GlobalSnapshotLogLines;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.execution.logger.parser.FlexiblePatternLogParser;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.schema.PhaseSchemaRegistry;
import com.becon.opencelium.backend.execution.logger.service.LogStorageService;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for the contract between the lines {@link GlobalSnapshotLogLines} writes and the
 * execution log that reads them: the parser, the line mapper and the log schema.
 *
 * <p>Each line is read the way the log reads it from its file: with the timestamp the log
 * pattern puts first and the line break it puts last.
 *
 * <p>Run with: ./gradlew test --tests "*.FlexiblePatternLogParserTest" -x generateProto
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FlexiblePatternLogParser — GLOBAL_SNAPSHOT lines — unit")
class FlexiblePatternLogParserTest {

    private static final String TIMESTAMP = "20-11-2026 08:30:00.123 - ";

    @Mock
    private LogStorageService logStorageService;

    @Test
    @DisplayName("parse — reads name, version and the whole value, even one holding spaces and 'data='")
    void parseReadsNameVersionAndDataWhenLineIsGlobalSnapshot() {
        String line = asLogged(new Entry("note", 3, TextNode.valueOf("a b data=c")));

        Map<LogLineKey, String> parsed = new FlexiblePatternLogParser(logStorageService).parse(line);

        assertThat(parsed).contains(
                entry(LogLineKey.SEGMENT, "GLOBAL_SNAPSHOT"),
                entry(LogLineKey.NAME, "note"),
                entry(LogLineKey.VERSION, "3"),
                entry(LogLineKey.DATA, "\"a b data=c\""));
    }

    @Test
    void parseReadsSizeWhenValueWasLeftOut() {
        String line = asLogged(new Entry("big", 1, TextNode.valueOf("x".repeat(5000))));

        Map<LogLineKey, String> parsed = new FlexiblePatternLogParser(logStorageService).parse(line);

        assertThat(parsed)
                .contains(entry(LogLineKey.NAME, "big"), entry(LogLineKey.SIZE, "5002"))
                .doesNotContainKey(LogLineKey.DATA);
    }

    @Test
    @DisplayName("map — a GLOBAL_SNAPSHOT line is a known segment, not an unknown one the pipeline drops")
    void mapReturnsGlobalSnapshotSegmentWhenLineHasThatSegment() {
        String line = asLogged(new Entry("idoitUrl", 4, TextNode.valueOf("https://cmdb.example")));
        Map<LogLineKey, String> parsed = new FlexiblePatternLogParser(logStorageService).parse(line);

        ParsedLogLine parsedLine = new ParsedLogLineMapper().map(parsed);

        assertThat(parsedLine.getType()).isEqualTo(LogLineType.SEGMENT);
        assertThat(parsedLine.getStage()).isEqualTo(SegmentType.GLOBAL_SNAPSHOT);
    }

    @ParameterizedTest
    @EnumSource(LogDetailLevel.class)
    @DisplayName("getAllowedSegments — the log schema lets the EXECUTION phase hold GLOBAL_SNAPSHOT lines")
    void getAllowedSegmentsIncludesGlobalSnapshotWhenPhaseIsExecution(LogDetailLevel level) {
        PhaseSchemaRegistry registry = new PhaseSchemaRegistry();

        assertThat(registry.getAllowedSegments(level, PhaseCategory.EXECUTION)).contains("GLOBAL_SNAPSHOT");
    }

    /** Returns the only line the writer logs for {@code entry}, as the log file holds it. */
    private static String asLogged(Entry entry) {
        return TIMESTAMP + GlobalSnapshotLogLines.of(aSnapshotOf(entry)).get(0) + "\n";
    }
}
