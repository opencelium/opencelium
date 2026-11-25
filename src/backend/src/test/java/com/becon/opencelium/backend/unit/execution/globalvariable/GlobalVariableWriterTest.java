package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link GlobalVariableWriter}: which runs may write a mutable variable, when a
 * write is stored or kept in the run's own copy only, and what a run logs of its writes when it
 * ends.
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
    private static final ObjectMapper JSON = new ObjectMapper();

    @Mock
    GlobalVariableRepository repository;

    @Mock
    GlobalVariableChangeRepository changeRepository;

    private final TestRunOrigins testRunOrigins = new TestRunOrigins();

    private GlobalVariableWriter writer;

    @BeforeEach
    void setUp() {
        writer = new GlobalVariableWriter(repository, changeRepository, testRunOrigins, MAX_VALUE_BYTES);
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
    @DisplayName("write — a run of any of several owner workflows stores its value")
    void writeStoresValueWhenRunIsOfOneOfSeveralOwnerWorkflows() {
        GlobalVariable variable = aLastSync();
        variable.getOwnerWorkflowIds().add(43L);
        givenVariables(variable);

        writer.forRun(43L, EXECUTION).write("lastSync", "b");

        verify(repository).writeCurrentValue(eq(5L), eq("\"b\""), any(Date.class), eq(EXECUTION));
    }

    @Test
    void writeThrowsWhenOwnerWorkflowWasDeleted() {
        GlobalVariable variable = aLastSync();
        variable.getOwnerWorkflowIds().clear();
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

    // ── reading the current value live ────────────────────────────────────────

    @Test
    @DisplayName("readCurrent — any run reads the value the store holds now, not only the owner's")
    void readCurrentReturnsStoredValueWhenVariableIsMutable() throws JsonProcessingException {
        givenVariables(GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", "{\"page\":3}", OWNER_WORKFLOW));

        Optional<JsonNode> current = writer.forRun(43L, EXECUTION).readCurrent("lastSync");

        assertThat(current).contains(JSON.readTree("{\"page\":3}"));
    }

    @Test
    void readCurrentReturnsNullNodeWhenCurrentValueIsNull() {
        givenVariables(GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", null, OWNER_WORKFLOW));

        Optional<JsonNode> current = writer.forRun(OWNER_WORKFLOW, EXECUTION).readCurrent("lastSync");

        assertThat(current).contains(NullNode.getInstance());
    }

    @Test
    void readCurrentReturnsEmptyWhenVariableIsConstant() {
        givenVariables(GlobalVariableFixture.aConstant(5L, "lastSync", "\"a\""));

        assertThat(writer.forRun(OWNER_WORKFLOW, EXECUTION).readCurrent("lastSync")).isEmpty();
    }

    @Test
    void readCurrentReturnsEmptyWhenVariableNoLongerExists() {
        givenVariables();

        assertThat(writer.forRun(OWNER_WORKFLOW, EXECUTION).readCurrent("lastSync")).isEmpty();
    }

    @Test
    void readCurrentThrowsWhenStoredValueIsNotJson() {
        givenVariables(GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", "{broken", OWNER_WORKFLOW));
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        assertThatThrownBy(() -> run.readCurrent("lastSync"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("lastSync");
    }

    // ── logging what a run wrote ──────────────────────────────────────────────

    @Test
    @DisplayName("logWrites — the writes of a run to one variable become one entry: first old value, last new value")
    void logWritesSavesOneEntryWhenRunWroteSeveralTimes() {
        when(repository.findByNameIn(List.of("lastSync"))).thenReturn(
                List.of(aLastSyncHolding("\"a\"")),
                List.of(aLastSyncHolding("\"b\"")),
                List.of(aLastSyncHolding("\"c\"")));
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");
        run.write("lastSync", "c");
        run.write("lastSync", "d");

        run.logWrites();

        GlobalVariableChange entry = savedEntries(1).get(0);
        assertThat(entry.getChangeType()).isEqualTo(GlobalVariableChange.Type.RUN_WRITE);
        assertThat(entry.getActorType()).isEqualTo(GlobalVariableChange.ActorType.WORKFLOW);
        assertThat(entry.getResult()).isEqualTo(GlobalVariableChange.Result.SAVED);
        assertThat(entry.getVariableId()).isEqualTo(5L);
        assertThat(entry.getVariableName()).isEqualTo("lastSync");
        assertThat(entry.getOldValue()).isEqualTo("\"a\"");
        assertThat(entry.getNewValue()).isEqualTo("\"d\"");
        assertThat(entry.getWriteCount()).isEqualTo(3);
        assertThat(entry.getWorkflowId()).isEqualTo(OWNER_WORKFLOW);
        assertThat(entry.getExecutionId()).isEqualTo(EXECUTION);
        assertThat(entry.getUserId()).isNull();
        assertThat(entry.getVersionFrom()).isEqualTo(1L);
        assertThat(entry.getVersionTo()).isEqualTo(1L);
    }

    @Test
    void logWritesSavesEntryPerVariableWhenRunWroteTwo() {
        givenVariables(aLastSync());
        givenCursor();
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");
        run.write("cursor", 17);
        run.write("cursor", 18);

        run.logWrites();

        assertThat(savedEntries(2))
                .extracting(GlobalVariableChange::getVariableName, GlobalVariableChange::getOldValue,
                        GlobalVariableChange::getNewValue, GlobalVariableChange::getWriteCount)
                .containsExactly(tuple("lastSync", "\"a\"", "\"b\"", 1), tuple("cursor", "0", "18", 2));
    }

    @Test
    void logWritesSavesNothingWhenRunWroteNothing() {
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);

        run.logWrites();

        verifyNoInteractions(changeRepository);
    }

    @Test
    @DisplayName("logWrites — a test run stores nothing, so it has nothing to log")
    void logWritesSavesNothingWhenRunIsTestCopy() {
        testRunOrigins.register(TEST_COPY, OWNER_WORKFLOW);
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(TEST_COPY, EXECUTION);
        run.write("lastSync", "2026-11-20");

        run.logWrites();

        verifyNoInteractions(changeRepository);
    }

    @Test
    @DisplayName("logWrites — a write that was refused stored nothing and is not counted")
    void logWritesSkipsWriteWhenItWasRejected() {
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");
        assertThatThrownBy(() -> run.write("lastSync", "x".repeat(MAX_VALUE_BYTES)))
                .isInstanceOf(IllegalStateException.class);

        run.logWrites();

        GlobalVariableChange entry = savedEntries(1).get(0);
        assertThat(entry.getWriteCount()).isEqualTo(1);
        assertThat(entry.getNewValue()).isEqualTo("\"b\"");
    }

    @Test
    @DisplayName("logWrites — what was logged once is not logged again")
    void logWritesSavesNothingWhenCalledAgain() {
        givenVariables(aLastSync());
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");
        run.logWrites();

        run.logWrites();

        assertThat(savedEntries(1)).hasSize(1);
    }

    @Test
    @DisplayName("logWrites — past the limit, the entries up to the newest one beyond it are deleted")
    void logWritesDeletesOldestEntriesWhenLimitIsPassed() {
        givenVariables(aLastSync());
        when(changeRepository.findByVariableIdAndChangeTypeOrderByIdDesc(
                5L, GlobalVariableChange.Type.RUN_WRITE, PageRequest.of(2, 1)))
                .thenReturn(List.of(aRunEntryWithId(31L)));
        GlobalVariableWriter.Run run = aWriterKeeping(2).forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");

        run.logWrites();

        verify(changeRepository).deleteByTypeUpTo(5L, GlobalVariableChange.Type.RUN_WRITE, 31L);
    }

    @Test
    void logWritesDeletesNothingWhenLimitIsNotReached() {
        givenVariables(aLastSync());
        when(changeRepository.findByVariableIdAndChangeTypeOrderByIdDesc(
                5L, GlobalVariableChange.Type.RUN_WRITE, PageRequest.of(2, 1)))
                .thenReturn(List.of());
        GlobalVariableWriter.Run run = aWriterKeeping(2).forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");

        run.logWrites();

        verify(changeRepository, never()).deleteByTypeUpTo(anyLong(), any(), anyLong());
    }

    @Test
    @DisplayName("logWrites — an entry that cannot be saved is skipped; the run does not fail for its log")
    void logWritesLogsOtherVariablesWhenOneSaveFails() {
        givenVariables(aLastSync());
        givenCursor();
        when(changeRepository.save(any(GlobalVariableChange.class)))
                .thenThrow(new IllegalStateException("database is down"))
                .thenAnswer(invocation -> invocation.getArgument(0));
        GlobalVariableWriter.Run run = writer.forRun(OWNER_WORKFLOW, EXECUTION);
        run.write("lastSync", "b");
        run.write("cursor", 17);

        run.logWrites();

        assertThat(savedEntries(2))
                .extracting(GlobalVariableChange::getVariableName)
                .containsExactly("lastSync", "cursor");
    }

    private static GlobalVariable aLastSync() {
        return aLastSyncHolding("\"a\"");
    }

    /** Variable 5, {@code lastSync}, owned by the owner workflow, with the given current value. */
    private static GlobalVariable aLastSyncHolding(String currentJson) {
        return GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", currentJson, OWNER_WORKFLOW);
    }

    private void givenVariables(GlobalVariable... variables) {
        when(repository.findByNameIn(List.of("lastSync"))).thenReturn(List.of(variables));
    }

    /** Variable 6, {@code cursor}, a second variable of the owner workflow, holding 0. */
    private void givenCursor() {
        when(repository.findByNameIn(List.of("cursor")))
                .thenReturn(List.of(GlobalVariableFixture.aMutable(6L, "cursor", "0", "0", OWNER_WORKFLOW)));
    }

    /** A writer whose change log keeps that many entries of run writes per variable. */
    private GlobalVariableWriter aWriterKeeping(int maxRunEntries) {
        return new GlobalVariableWriter(repository, changeRepository, testRunOrigins, MAX_VALUE_BYTES,
                GlobalScript.DEFAULT_TIME_LIMIT.toMillis(), maxRunEntries);
    }

    /** An entry of run writes as the change log holds it, saved under the given id. */
    private static GlobalVariableChange aRunEntryWithId(long id) {
        GlobalVariableChange entry = GlobalVariableChange.writtenByRun(
                aLastSync(), "\"a\"", "\"b\"", OWNER_WORKFLOW, EXECUTION, 1, new Date());
        ReflectionTestUtils.setField(entry, "id", id);
        return entry;
    }

    /** Returns the entries the run handed to the change log, which must be that many. */
    private List<GlobalVariableChange> savedEntries(int expected) {
        ArgumentCaptor<GlobalVariableChange> saved = ArgumentCaptor.forClass(GlobalVariableChange.class);
        verify(changeRepository, times(expected)).save(saved.capture());
        return saved.getAllValues();
    }

    @Test
    void nameOfReturnsNameWhenTargetIsBracedToken() {
        assertThat(GlobalVariableWriter.ScriptSets.nameOf(" {{global.lastSync}} ")).contains("lastSync");
    }

    @ParameterizedTest
    @ValueSource(strings = {"global.lastSync", "{{global.lastSync.at}}",
            "x{{global.lastSync}}", ""})
    void nameOfReturnsEmptyWhenTargetIsNotBracedToken(String target) {
        assertThat(GlobalVariableWriter.ScriptSets.nameOf(target)).isEmpty();
    }

    @Test
    void unwrapThrowsWhenResultHoldsNoWrites() {
        assertThatThrownBy(() -> GlobalVariableWriter.ScriptSets.unwrap("plain"))
                .isInstanceOf(IllegalStateException.class);
    }
}
