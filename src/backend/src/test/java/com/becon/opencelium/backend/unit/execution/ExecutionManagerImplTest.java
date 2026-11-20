package com.becon.opencelium.backend.unit.execution;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.ExecutionManagerImpl;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import com.becon.opencelium.backend.scriptengine.ScriptEngineProvider;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManagerProvider;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.engines.PolyglotEngine;
import org.springframework.beans.factory.ObjectProvider;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.ParameterizedTest;

/**
 * Unit tests for how {@link ExecutionManagerImpl} is created and which extractor it resolves
 * references with.
 */
@DisplayName("ExecutionManagerImpl — unit")
class ExecutionManagerImplTest {

    private static final int CONNECTOR_ID = 1;
    private static final ObjectMapper JSON = new ObjectMapper();

    @BeforeEach
    void unbindExecutionLogger() {
        ThreadLocalOcLogger.clear();
    }

    @Test
    void getValueUsesGivenExtractorWhenFactoryIsGiven() {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(), Map.of(), Map.of(),
                self -> reference -> "resolved:" + reference);

        Object value = manager.getValue("${status}");

        assertThat(value).isEqualTo("resolved:${status}");
    }

    @Test
    @DisplayName("getValue — a global variable reaches the extractor as one reference")
    void getValuePassesWholeTokenToExtractorWhenValueIsGlobalVariableReference() {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(), Map.of(), Map.of(),
                self -> reference -> "resolved:" + reference);

        Object value = manager.getValue("{{global.limits.maxPerPage}}");

        assertThat(value).isEqualTo("resolved:{{global.limits.maxPerPage}}");
    }

    @Test
    @DisplayName("getValue — a global variable and request data in one text are resolved apart")
    void getValueResolvesEachReferenceWhenValueMixesGlobalVariableAndRequestData() {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(), Map.of(), Map.of(),
                self -> reference -> "<" + reference.replaceAll("[{}]", "") + ">");

        Object value = manager.getValue("{{global.idoitUrl}}/api/{tenant}");

        assertThat(value).isEqualTo("<global.idoitUrl>/api/<tenant>");
    }

    @Test
    void getGlobalValueReturnsSnapshotValueWhenVariableExists() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("limits", "{\"maxPerPage\":50}"));

        Object value = manager.getGlobalValue(GlobalReference.parse("{{global.limits.maxPerPage}}"));

        assertThat(value).isEqualTo(50);
    }

    @Test
    @DisplayName("getValue — a value that is only a global reference keeps its JSON type")
    void getValueReturnsTypedValueWhenValueIsOnlyGlobalReference() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("tenants", "[\"acme\",\"globex\"]"));

        Object value = manager.getValue("{{global.tenants}}");

        assertThat(value).isEqualTo(List.of("acme", "globex"));
    }

    @Test
    @DisplayName("getValue — inside a longer text a global list is compact JSON, not Java's [a, b]")
    void getValueWritesGlobalListAsJsonWhenTextSurroundsIt() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("tenants", "[\"acme\",\"globex\"]"));

        Object value = manager.getValue("ids={{global.tenants}}");

        assertThat(value).isEqualTo("ids=[\"acme\",\"globex\"]");
    }

    @Test
    @DisplayName("getValue — a global value is data: a reference written in it is not resolved")
    void getValueKeepsGlobalValueLiteralWhenItHoldsAnotherReference() {
        ExecutionManager manager = aManagerWith(Map.of("token", "s3cr3t"), aSnapshot("template", "\"{token}\""));

        Object value = manager.getValue("{{global.template}} {token}");

        assertThat(value).isEqualTo("{token} s3cr3t");
    }

    @Test
    @DisplayName("getValue — text another reference brings in cannot name a global variable")
    void getValueIgnoresGlobalTokenWhenAnotherReferenceBringsItIn() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(
                anEntry("apiKey", "\"k3y\""),
                anEntry("name", "\"acme\"")));
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of("note", "{{global.apiKey}}"), List.of(), Map.of(), Map.of(), Map.of(),
                snapshot, ReferenceExtractor::new);

        Object value = manager.getValue("${note} {{global.name}}");

        assertThat(value).isEqualTo("{{global.apiKey}} acme");
    }

    @Test
    @DisplayName("getValue — an escaped token is literal text and leaves without its backslash")
    void getValueRemovesBackslashWhenTextHoldsOnlyEscapedToken() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("name", "\"acme\""));

        Object value = manager.getValue("\\{{global.name}}");

        assertThat(value).isEqualTo("{{global.name}}");
    }

    @Test
    @DisplayName("getValue — an escaped token stays literal next to a reference to the same variable")
    void getValueKeepsEscapedTokenWhenReferencesSurroundIt() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("name", "\"acme\""));

        Object value = manager.getValue("\\{{global.name}} {{global.name}}");

        assertThat(value).isEqualTo("{{global.name}} acme");
    }

    @Test
    @DisplayName("getValue — a connector value arrives resolved: a token it brings in is text, not a reference")
    void getValueKeepsGlobalTokenWhenConnectorValueBringsItIn() {
        ExecutionManager manager = aManagerWith(
                Map.of("url", "{{global.idoitUrl}}"), aSnapshot("idoitUrl", "\"https://cmdb.example.test\""));

        Object value = manager.getValue("{url}/api");

        assertThat(value).isEqualTo("{{global.idoitUrl}}/api");
    }

    @Test
    @DisplayName("getGlobalValue — inside a loop the iterator in the path is the current index")
    void getGlobalValueReadsCurrentElementWhenLoopIsRunning() {
        ExecutionManager manager =
                aManagerWith(Map.of(), aSnapshot("tenants", "[{\"id\":\"acme\"},{\"id\":\"globex\"}]"));
        manager.getLoops().add(aLoopAt("for", "i", "for {{global.tenants}}", 1, "1"));

        Object value = manager.getGlobalValue(GlobalReference.parse("{{global.tenants[i].id}}"));

        assertThat(value).isEqualTo("globex");
    }

    @Test
    @DisplayName("getGlobalValue — a key made of digits is still a key of the map forin walks")
    void getGlobalValueReadsMapEntryWhenForInKeyIsNumeric() {
        ExecutionManager manager =
                aManagerWith(Map.of(), aSnapshot("codes", "{\"200\":\"ok\",\"404\":\"missing\"}"));
        manager.getLoops().add(aLoopAt("forin", "j", "forin {{global.codes}}", 1, "404"));

        Object value = manager.getGlobalValue(GlobalReference.parse("{{global.codes['j']}}"));

        assertThat(value).isEqualTo("missing");
    }

    @Test
    @DisplayName("getGlobalValue — a path ending in [k]~ is the current part of the running split")
    void getGlobalValueReturnsSplitPartWhenSplitLoopIsRunning() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("csv", "\"acme,globex,initech\""));
        manager.getLoops().add(aLoopAt("SplitString", "k", "{{global.csv}} SplitString ','", 1, "globex"));

        Object value = manager.getGlobalValue(GlobalReference.parse("{{global.csv[k]~}}"));

        assertThat(value).isEqualTo("globex");
    }

    @Test
    @DisplayName("constructor — needs no execution logger bound to the thread")
    void constructorSucceedsWhenNoLoggerIsBound() {
        assertThatCode(() -> new ExecutionManagerImpl(Map.of(), List.of(), Map.of(), Map.of(), Map.of()))
                .doesNotThrowAnyException();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** A manager with the real extractor, the request data of connector 1 and a snapshot. */
    private static ExecutionManager aManagerWith(Map<String, String> requestData, GlobalVariableSnapshot snapshot) {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(CONNECTOR_ID, requestData), Map.of(), Map.of(),
                snapshot, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }

    private static GlobalVariableSnapshot aSnapshot(String name, String json) {
        return GlobalVariableSnapshot.of(List.of(anEntry(name, json)));
    }

    private static GlobalVariableSnapshot.Entry anEntry(String name, String json) {
        try {
            return new GlobalVariableSnapshot.Entry(name, 1, JSON.readTree(json));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(json, e);
        }
    }

    /** A loop at its iteration {@code index}, where the value of its iterator is {@code value}. */
    private static Loop aLoopAt(String type, String iterator, String expression, int index, String value) {
        OperatorEx operator = new OperatorEx();
        operator.setType(type);
        operator.setIterator(iterator);
        operator.setExpression(expression);

        Loop loop = Loop.fromOperator(operator);
        loop.setIndex(index);
        loop.setValue(value);
        return loop;
    }

    // ── writing mutable global variables ──────────────────────────────────────

    @Test
    @DisplayName("writeGlobal — every later read of the run sees the written value")
    void writeGlobalReplacesValueWhenWriterAcceptsIt() {
        ExecutionManager manager = aWritingManager(aSnapshot("lastSync", "\"old\""), aMutable("lastSync"));

        manager.writeGlobal("lastSync", "new");

        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("new");
    }

    @Test
    void writeGlobalThrowsNotFoundWhenVariableIsOutsideSnapshot() {
        ExecutionManager manager = aWritingManager(aSnapshot("other", "1"));

        assertThatThrownBy(() -> manager.writeGlobal("lastSync", "new"))
                .isInstanceOf(GlobalVariableNotFoundException.class);
    }

    @Test
    void writeGlobalThrowsWhenRunHasNoWriter() {
        ExecutionManager manager = aManagerWith(Map.of(), aSnapshot("lastSync", "\"old\""));

        assertThatThrownBy(() -> manager.writeGlobal("lastSync", "new"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("applyGlobalWrites — writes in order, so a later value reads an earlier write")
    void applyGlobalWritesWritesInOrderWhenValuesReadEachOther() {
        ExecutionManager manager = aWritingManager(
                GlobalVariableSnapshot.of(List.of(anEntry("a", "0"), anEntry("b", "0"))), aMutable("a"), aMutable("b"));
        Map<String, String> writes = new LinkedHashMap<>();
        writes.put("global.a", "5");
        writes.put("global.b", "{{global.a}}");

        manager.applyGlobalWrites(writes, "createVm");

        assertThat(manager.getValue("{{global.a}}")).isEqualTo(5);
        assertThat(manager.getValue("{{global.b}}")).isEqualTo(5);
    }

    @Test
    @DisplayName("applyGlobalWrites — JSON text becomes its JSON value, other text stays text")
    void applyGlobalWritesParsesJsonWhenValueIsNoReference() {
        ExecutionManager manager = aWritingManager(
                GlobalVariableSnapshot.of(List.of(anEntry("a", "0"), anEntry("b", "0"))), aMutable("a"), aMutable("b"));
        Map<String, String> writes = new LinkedHashMap<>();
        writes.put("global.a", "[1, 2]");
        writes.put("global.b", "not json");

        manager.applyGlobalWrites(writes, "createVm");

        assertThat(manager.getValue("{{global.a}}")).isEqualTo(List.of(1, 2));
        assertThat(manager.getValue("{{global.b}}")).isEqualTo("not json");
    }

    @ParameterizedTest
    @ValueSource(strings = {"{{global.a}}", "global.a.x", "a", "global.a x"})
    void applyGlobalWritesThrowsWhenTargetIsNotGlobalName(String target) {
        ExecutionManager manager = aWritingManager(aSnapshot("a", "{}"), aMutable("a"));

        assertThatThrownBy(() -> manager.applyGlobalWrites(Map.of(target, "1"), "createVm"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("createVm");
    }

    private static final long OWNER_WORKFLOW = 42L;

    /** A manager whose run belongs to the owner workflow of {@code variables}. */
    private static ExecutionManager aWritingManager(GlobalVariableSnapshot snapshot, GlobalVariable... variables) {
        GlobalVariableRepository repository = mock(GlobalVariableRepository.class);
        for (GlobalVariable variable : variables) {
            when(repository.findByNameIn(List.of(variable.getName()))).thenReturn(List.of(variable));
        }
        GlobalVariableWriter.Run run = new GlobalVariableWriter(repository, new TestRunOrigins(), 1024)
                .forRun(OWNER_WORKFLOW, 900L);

        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(CONNECTOR_ID, Map.of()), Map.of(), Map.of(),
                snapshot, run, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }

    private static GlobalVariable aMutable(String name) {
        return GlobalVariableFixture.aMutable(5L, name, "0", "0", OWNER_WORKFLOW);
    }

    // ── set() in an enhancement ───────────────────────────────────────────────

    @Test
    @DisplayName("executeScript — set() writes once the script is done, and the run reads the new value")
    void executeScriptWritesGlobalWhenJavaScriptCallsSet() {
        givenScriptEngines();
        ExecutionManager manager = aWritingManager(aSnapshot("lastSync", "\"old\""),
                List.of(anEnhancement("b1", "js", "set('{{global.lastSync}}', 'new'); RESULT_VAR = 'ok';")),
                aMutable("lastSync"));

        Object result = manager.executeScript("b1");

        assertThat(result).isEqualTo("ok");
        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("new");
    }

    @Test
    void executeScriptThrowsWhenSetTargetHasPath() {
        givenScriptEngines();
        ExecutionManager manager = aWritingManager(aSnapshot("lastSync", "{}"),
                List.of(anEnhancement("b1", "js", "set('{{global.lastSync.at}}', 1);")), aMutable("lastSync"));

        assertThatThrownBy(() -> manager.executeScript("b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("{{global.lastSync.at}}");
        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo(Map.of());
    }

    @Test
    @DisplayName("executeScript — set() is JavaScript only; another language fails before it runs")
    void executeScriptThrowsWhenNonJavaScriptCallsSet() {
        PolyglotEngine python = mock(PolyglotEngine.class);
        when(python.supports(any())).thenReturn(true);
        when(python.isUp()).thenReturn(true);
        givenScriptEngines(python);
        ExecutionManager manager = aWritingManager(aSnapshot("lastSync", "0"),
                List.of(anEnhancement("b1", "python3", "set('{{global.lastSync}}', 1)")), aMutable("lastSync"));

        assertThatThrownBy(() -> manager.executeScript("b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JavaScript only");
        verify(python, never()).execute(anyString(), any(Map.class), any());
    }

    /** Registers the script engines executeScript finds: Nashorn, and the given polyglot engine. */
    @SuppressWarnings("unchecked")
    private static void givenScriptEngines(PolyglotEngine... polyglot) {
        ObjectProvider<PolyglotEngine> polyglotProvider = mock(ObjectProvider.class);
        PolyglotEngine none = mock(PolyglotEngine.class);
        when(polyglotProvider.getObject()).thenReturn(polyglot.length > 0 ? polyglot[0] : none);
        ObjectProvider<NashornEngine> nashornProvider = mock(ObjectProvider.class);
        when(nashornProvider.getObject()).thenReturn(new NashornEngine());
        new ScriptExecutionManagerProvider(new ScriptEngineProvider(polyglotProvider, nashornProvider));
    }

    private static FieldBindEx anEnhancement(String bindId, String language, String script) {
        EnhancementEx enhancement = new EnhancementEx();
        enhancement.setLang(language);
        enhancement.setScript(script);
        enhancement.setArgs(Map.of());
        FieldBindEx binding = new FieldBindEx();
        binding.setBindId(bindId);
        binding.setEnhance(enhancement);
        return binding;
    }

    /** A manager with field bindings whose run belongs to the owner workflow of {@code variables}. */
    private static ExecutionManager aWritingManager(GlobalVariableSnapshot snapshot, List<FieldBindEx> bindings,
            GlobalVariable... variables) {
        GlobalVariableRepository repository = mock(GlobalVariableRepository.class);
        for (GlobalVariable variable : variables) {
            when(repository.findByNameIn(List.of(variable.getName()))).thenReturn(List.of(variable));
        }
        GlobalVariableWriter.Run run = new GlobalVariableWriter(repository, new TestRunOrigins(), 1024)
                .forRun(OWNER_WORKFLOW, 900L);

        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), bindings, Map.of(CONNECTOR_ID, Map.of()), Map.of(), Map.of(),
                snapshot, run, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }
}
