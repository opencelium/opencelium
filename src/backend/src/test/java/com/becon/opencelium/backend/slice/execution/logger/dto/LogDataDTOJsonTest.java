package com.becon.opencelium.backend.slice.execution.logger.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.logger.dto.GlobalSnapshotEntryDTO;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.json.JsonContent;
import org.springframework.test.context.ActiveProfiles;

/**
 * Slice tests for how the global snapshot of a run's log element is written as JSON, the shape
 * the execution log API returns.
 *
 * <p>Run with: ./gradlew test --tests "*.LogDataDTOJsonTest" -x generateProto
 */
@JsonTest
@ActiveProfiles("test")
@DisplayName("LogDataDTO — global snapshot JSON — slice")
class LogDataDTOJsonTest {

    @Autowired
    private JacksonTester<LogDataDTO> json;

    @Test
    @DisplayName("serialize — a value is written as JSON, not as a string holding JSON")
    void serializeWritesValueAsJsonWhenVariableIsPlain() throws Exception {
        LogDataDTO execution = anExecutionWith(GlobalSnapshotEntryDTO.withValue(
                "limits", 3L, new ObjectMapper().readTree("{\"max\":50}")));

        JsonContent<LogDataDTO> written = json.write(execution);

        assertThat(written).extractingJsonPathNumberValue("$.globalSnapshot[0].value.max").isEqualTo(50);
    }

    @Test
    @DisplayName("serialize — no globalSnapshot field for an element without one, such as an old run")
    void serializeOmitsSnapshotWhenNull() throws Exception {
        LogDataDTO execution = anExecutionWith();
        execution.setGlobalSnapshot(null);

        JsonContent<LogDataDTO> written = json.write(execution);

        assertThat(written).doesNotHaveJsonPath("$.globalSnapshot");
    }

    @Test
    @DisplayName("serialize — a variable whose value is JSON null keeps \"value\": null")
    void serializeWritesNullValueWhenVariableIsJsonNull() throws Exception {
        LogDataDTO execution = anExecutionWith(GlobalSnapshotEntryDTO.withValue("optional", 1L, NullNode.getInstance()));

        JsonContent<LogDataDTO> written = json.write(execution);

        assertThat(written)
                .hasJsonPath("$.globalSnapshot[0].value")
                .extractingJsonPathValue("$.globalSnapshot[0].value").isNull();
    }

    @Test
    @DisplayName("serialize — a value left out of the log has no value field, only the marker and its size")
    void serializeOmitsValueWhenValueOmitted() throws Exception {
        LogDataDTO execution = anExecutionWith(GlobalSnapshotEntryDTO.withoutValue("tenantMap", 7L, 70321L));

        JsonContent<LogDataDTO> written = json.write(execution);

        assertThat(written).doesNotHaveJsonPath("$.globalSnapshot[0].value");
        assertThat(written).extractingJsonPathBooleanValue("$.globalSnapshot[0].valueOmitted").isTrue();
        assertThat(written).extractingJsonPathNumberValue("$.globalSnapshot[0].valueBytes").isEqualTo(70321);
    }

    private static LogDataDTO anExecutionWith(GlobalSnapshotEntryDTO... entries) {
        LogDataDTO execution = new LogDataDTO();
        execution.setId("69fac335ee4ea82b347c51ef");
        execution.setExecutionId("1");
        execution.setType(PhaseCategory.EXECUTION);
        execution.setGlobalSnapshot(List.of(entries));
        return execution;
    }
}
