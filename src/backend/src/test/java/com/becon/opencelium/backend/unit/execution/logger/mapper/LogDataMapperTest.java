package com.becon.opencelium.backend.unit.execution.logger.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.entity.LogGlobalSnapshotEntry;
import com.becon.opencelium.backend.execution.logger.dto.GlobalSnapshotEntryDTO;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.testutil.fixture.LogDataMngFixture;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for how {@link LogDataMapper} returns the global snapshot of a run's log element.
 *
 * <p>Run with: ./gradlew test --tests "*.LogDataMapperTest" -x generateProto
 */
@DisplayName("LogDataMapper — unit")
class LogDataMapperTest {

    private final LogDataMapper mapper = new LogDataMapper();

    @Test
    @DisplayName("toDto — no snapshot is returned for an element that has none, such as an old run")
    void toDtoLeavesSnapshotOutWhenElementHasNone() {
        LogDataMng execution = LogDataMngFixture.anExecutionCompletePhaseLogData();

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).isNull();
    }

    @Test
    void toDtoReturnsValueAsJsonWhenValueIsLogged() throws Exception {
        LogDataMng execution = anExecutionWith(new LogGlobalSnapshotEntry("cmdb", 4L, "{\"port\":8080}", null));

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).containsExactly(
                GlobalSnapshotEntryDTO.withValue("cmdb", 4L, new ObjectMapper().readTree("{\"port\":8080}")));
    }

    @Test
    void toDtoReturnsMaskWhenVariableIsSecret() {
        LogDataMng execution = anExecutionWith(new LogGlobalSnapshotEntry("idoitApiKey", 2L, "\"••••\"", null));

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).containsExactly(
                GlobalSnapshotEntryDTO.withValue("idoitApiKey", 2L, TextNode.valueOf("••••")));
    }

    @Test
    void toDtoMarksValueOmittedWhenLogLeftValueOut() {
        LogDataMng execution = anExecutionWith(new LogGlobalSnapshotEntry("tenantMap", 7L, null, 70321L));

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).containsExactly(
                new GlobalSnapshotEntryDTO("tenantMap", 7L, null, Boolean.TRUE, 70321L));
    }

    @Test
    @DisplayName("toDto — a value the logger made invalid JSON by hiding a secret text is returned as text")
    void toDtoReturnsTextWhenLoggedValueIsNoLongerJson() {
        LogDataMng execution = anExecutionWith(new LogGlobalSnapshotEntry("cmdb", 4L, "{\"port\":****}", null));

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).containsExactly(
                GlobalSnapshotEntryDTO.withValue("cmdb", 4L, TextNode.valueOf("{\"port\":****}")));
    }

    @Test
    void toDtoReturnsJsonNullWhenValueIsNull() {
        LogDataMng execution = anExecutionWith(new LogGlobalSnapshotEntry("optional", 1L, "null", null));

        LogDataDTO dto = mapper.toDto(execution);

        assertThat(dto.getGlobalSnapshot()).containsExactly(
                GlobalSnapshotEntryDTO.withValue("optional", 1L, NullNode.getInstance()));
    }

    private static LogDataMng anExecutionWith(LogGlobalSnapshotEntry entry) {
        LogDataMng execution = LogDataMngFixture.anExecutionCompletePhaseLogData();
        execution.setGlobalSnapshot(List.of(entry));
        return execution;
    }
}
