package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.Date;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link GlobalVariableWriter}: which runs may write a mutable variable, and when
 * a write is stored or kept in the run's own copy only.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableWriterTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableWriter — unit")
class GlobalVariableWriterTest {

    private static final long OWNER_WORKFLOW = 42L;
    private static final long TEST_COPY = 77L;
    private static final long EXECUTION = 900L;
    private static final int MAX_VALUE_BYTES = 32;

    @Mock
    GlobalVariableRepository repository;

    private final TestRunOrigins testRunOrigins = new TestRunOrigins();

    private GlobalVariableWriter writer;

    @BeforeEach
    void setUp() {
        writer = new GlobalVariableWriter(repository, testRunOrigins, MAX_VALUE_BYTES);
    }

    @Test
    void writeStoresValueWithExecutionWhenRunIsOfOwnerWorkflow() {
        givenVariables(aLastSync());

        JsonNode written = writer.forRun(OWNER_WORKFLOW, EXECUTION).write("lastSync", "2026-11-20");

        assertThat(written).isEqualTo(new TextNode("2026-11-20"));
        verify(repository).writeCurrentValue(eq(5L), eq("\"2026-11-20\""), any(Date.class), eq(EXECUTION));
    }

    @Test
    void writeStoresMapAsJsonTextWhenValueIsMap() {
        givenVariables(aLastSync());

        writer.forRun(OWNER_WORKFLOW, EXECUTION).write("lastSync", Map.of("page", 3));

        verify(repository).writeCurrentValue(eq(5L), eq("{\"page\":3}"), any(Date.class), eq(EXECUTION));
    }

    @Test
    @DisplayName("write — a test run is checked as its origin but keeps the value in its own copy")
    void writeStoresNothingWhenRunIsTestCopyOfOwner() {
        testRunOrigins.register(TEST_COPY, OWNER_WORKFLOW);
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(TEST_COPY, EXECUTION);

        JsonNode written = run.write("lastSync", "2026-11-20");

        assertThat(run.isTestRun()).isTrue();
        assertThat(written).isEqualTo(new TextNode("2026-11-20"));
        verify(repository, never()).writeCurrentValue(anyLong(), anyString(), any(), anyLong());
    }

    @Test
    void writeThrowsWhenVariableIsConstant() {
        givenVariables(GlobalVariableFixture.aConstant(5L, "lastSync", "\"a\""));
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        assertThatThrownBy(() -> run.write("lastSync", "b"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CONSTANT");
        verify(repository, never()).writeCurrentValue(anyLong(), anyString(), any(), anyLong());
    }

    @Test
    void writeThrowsWhenWorkflowIsNotOwner() {
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(43L, EXECUTION);

        assertThatThrownBy(() -> run.write("lastSync", "b"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("owner");
        verify(repository, never()).writeCurrentValue(anyLong(), anyString(), any(), anyLong());
    }

    @Test
    void writeThrowsWhenOwnerWorkflowWasDeleted() {
        GlobalVariable variable = aLastSync();
        variable.setOwnerWorkflowId(null);
        givenVariables(variable);
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        assertThatThrownBy(() -> run.write("lastSync", "b")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void writeThrowsWhenValueIsTooLarge() {
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        assertThatThrownBy(() -> run.write("lastSync", "x".repeat(MAX_VALUE_BYTES)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(MAX_VALUE_BYTES + " bytes");
        verify(repository, never()).writeCurrentValue(anyLong(), anyString(), any(), anyLong());
    }

    @Test
    @DisplayName("write — a name that differs only in case is another name, as a run reads it")
    void writeThrowsNotFoundWhenOnlyCaseMatches() {
        givenVariables(GlobalVariableFixture.aMutable(5L, "LastSync", "\"a\"", "\"a\"", OWNER_WORKFLOW));
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        assertThatThrownBy(() -> run.write("lastSync", "b")).isInstanceOf(GlobalVariableNotFoundException.class);
    }

    private static GlobalVariable aLastSync() {
        return GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", "\"a\"", OWNER_WORKFLOW);
    }

    private void givenVariables(GlobalVariable... variables) {
        when(repository.findByNameIn(List.of("lastSync"))).thenReturn(List.of(variables));
    }
}
