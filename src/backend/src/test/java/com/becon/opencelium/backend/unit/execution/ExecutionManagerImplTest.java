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
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
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
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.databind.node.TextNode;
import java.time.Duration;
import org.springframework.beans.factory.ObjectProvider;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.ParameterizedTest;
import org.mockito.ArgumentCaptor;

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
        GlobalVariableWriter.Run run = new GlobalVariableWriter(repository, mock(GlobalVariableChangeRepository.class),
                new TestRunOrigins(), 1024)
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

    // ── reading mutable global variables live ─────────────────────────────────

    private static final long READING_WORKFLOW = 43L;
    private static final long TEST_COPY = 77L;

    @Test
    @DisplayName("getValue — a mutable variable gives what its owner wrote after this run started")
    void getValueReadsStoredValueWhenMutableChangedSinceStart() {
        GlobalVariableRepository repository = aStoreWith(
                GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", "\"new\"", OWNER_WORKFLOW));
        ExecutionManager manager = aReadingManager(aMutableSnapshot("lastSync", "\"old\""), repository,
                new TestRunOrigins(), READING_WORKFLOW);

        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("new");
    }

    @Test
    void getValueFollowsPathIntoStoredValueWhenVariableIsMutable() {
        GlobalVariableRepository repository = aStoreWith(
                GlobalVariableFixture.aMutable(5L, "state", "{}", "{\"page\":4}", OWNER_WORKFLOW));
        ExecutionManager manager = aReadingManager(aMutableSnapshot("state", "{\"page\":1}"), repository,
                new TestRunOrigins(), READING_WORKFLOW);

        assertThat(manager.getValue("{{global.state.page}}")).isEqualTo(4);
    }

    @Test
    @DisplayName("getValue — a constant comes from the snapshot, the store is not asked")
    void getValueReadsSnapshotOnlyWhenVariableIsConstant() {
        GlobalVariableRepository repository = mock(GlobalVariableRepository.class);
        ExecutionManager manager = aReadingManager(aSnapshot("limit", "5"), repository,
                new TestRunOrigins(), READING_WORKFLOW);

        assertThat(manager.getValue("{{global.limit}}")).isEqualTo(5);
        verify(repository, never()).findByNameIn(any());
    }

    @Test
    void getValueKeepsLastSeenValueWhenMutableIsGoneFromStore() {
        GlobalVariableRepository repository = aStoreWith();
        ExecutionManager manager = aReadingManager(aMutableSnapshot("lastSync", "\"old\""), repository,
                new TestRunOrigins(), READING_WORKFLOW);

        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("old");
    }

    @Test
    @DisplayName("getValue — a test run reads the store until it writes, then its own copy")
    void getValueReadsOwnCopyWhenTestRunWroteMutable() {
        GlobalVariableRepository repository = aStoreWith(
                GlobalVariableFixture.aMutable(5L, "lastSync", "\"a\"", "\"stored\"", OWNER_WORKFLOW));
        TestRunOrigins origins = new TestRunOrigins();
        origins.register(TEST_COPY, OWNER_WORKFLOW);
        ExecutionManager manager = aReadingManager(aMutableSnapshot("lastSync", "\"old\""), repository,
                origins, TEST_COPY);

        Object beforeWrite = manager.getValue("{{global.lastSync}}");
        manager.writeGlobal("lastSync", "mine");

        assertThat(beforeWrite).isEqualTo("stored");
        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("mine");
    }

    @Test
    void getValueReadsSnapshotWhenRunHasNoWriter() {
        ExecutionManager manager = aManagerWith(Map.of(), aMutableSnapshot("lastSync", "\"old\""));

        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("old");
    }

    /** A store that finds each of {@code variables} by its name, and nothing else. */
    private static GlobalVariableRepository aStoreWith(GlobalVariable... variables) {
        GlobalVariableRepository repository = mock(GlobalVariableRepository.class);
        when(repository.findByNameIn(any())).thenReturn(List.of());
        for (GlobalVariable variable : variables) {
            when(repository.findByNameIn(List.of(variable.getName()))).thenReturn(List.of(variable));
        }
        return repository;
    }

    /** A manager whose run executes workflow {@code connectionId} against {@code repository}. */
    private static ExecutionManager aReadingManager(GlobalVariableSnapshot snapshot,
            GlobalVariableRepository repository, TestRunOrigins origins, long connectionId) {
        GlobalVariableWriter.Run run = new GlobalVariableWriter(repository, mock(GlobalVariableChangeRepository.class), origins, 1024)
                .forRun(connectionId, 900L);

        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(CONNECTOR_ID, Map.of()), Map.of(), Map.of(),
                snapshot, run, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }

    private static GlobalVariableSnapshot aMutableSnapshot(String name, String json) {
        try {
            return GlobalVariableSnapshot.of(List.of(
                    GlobalVariableSnapshot.Entry.ofMutable(name, 1, JSON.readTree(json), true)));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(json, e);
        }
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
        GlobalVariableWriter.Run run = new GlobalVariableWriter(repository, mock(GlobalVariableChangeRepository.class),
                new TestRunOrigins(), 1024)
                .forRun(OWNER_WORKFLOW, 900L);

        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), bindings, Map.of(CONNECTOR_ID, Map.of()), Map.of(), Map.of(),
                snapshot, run, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }

    // ── script variables imported by an enhancement ───────────────────────────

    private static final String FORMAT_DATE_DEFINITION = new GlobalScript("js", GlobalVariableFixture.FORMAT_DATE_CODE,
            List.of(new GlobalScript.Parameter("date", null, true, null),
                    new GlobalScript.Parameter("pattern", null, false, new TextNode("dd.MM.yyyy")))).toJson();

    @Test
    @DisplayName("executeScript — //var VAR_1 = {{global.formatDate}}; makes VAR_1 a function the code calls")
    void executeScriptCallsImportedScriptWhenArgNamesScriptVariable() throws Exception {
        givenScriptEngines();
        Map<String, String> args = Map.of("VAR_0", "{{global.tenantPrefix}}", "VAR_1", " {{global.formatDate}} ");
        ExecutionManager manager = aScriptManager(aScriptSnapshot(FORMAT_DATE_DEFINITION),
                anEnhancementWithArgs("js", "RESULT_VAR = VAR_0 + '-' + VAR_1('2026-11-17T22:00:00Z', 'dd.MM');", args),
                Duration.ofSeconds(5));

        assertThat(manager.executeScript("b1")).isEqualTo("ACME-17.11");
    }

    @Test
    void executeScriptWritesGlobalWhenCodeCallsImportedScriptAndSet() throws Exception {
        givenScriptEngines();
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(anEntry("lastSync", "\"old\""),
                GlobalVariableSnapshot.Entry.ofScript("formatDate", 1, JSON.readTree(FORMAT_DATE_DEFINITION), true)));
        FieldBindEx binding = anEnhancementWithArgs("js",
                "set('{{global.lastSync}}', VAR_1('2026-11-17T22:00:00Z')); RESULT_VAR = 'ok';",
                Map.of("VAR_1", "{{global.formatDate}}"));
        ExecutionManager manager = aWritingManager(snapshot, List.of(binding), aMutable("lastSync"));

        assertThat(manager.executeScript("b1")).isEqualTo("ok");
        assertThat(manager.getValue("{{global.lastSync}}")).isEqualTo("17.11.2026");
    }

    @Test
    void executeScriptThrowsWhenScriptIsImportedIntoAnotherLanguage() throws Exception {
        PolyglotEngine python = mock(PolyglotEngine.class);
        when(python.supports(any())).thenReturn(true);
        when(python.isUp()).thenReturn(true);
        givenScriptEngines(python);
        ExecutionManager manager = aScriptManager(aScriptSnapshot(FORMAT_DATE_DEFINITION),
                anEnhancementWithArgs("python3", "RESULT_VAR = VAR_1('x')", Map.of("VAR_1", "{{global.formatDate}}")),
                Duration.ofSeconds(5));

        assertThatThrownBy(() -> manager.executeScript("b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("'formatDate' is written in 'js'");
        verify(python, never()).execute(anyString(), any(Map.class));
    }

    @Test
    @DisplayName("executeScript — a Python script is defined before the code of a python3 enhancement, "
            + "whose other args the polyglot engine converts as usual")
    @SuppressWarnings("unchecked")
    void executeScriptDefinesPythonScriptWhenPythonEnhancementImportsIt() throws Exception {
        PolyglotEngine python = mock(PolyglotEngine.class);
        when(python.supports(any())).thenReturn(true);
        when(python.isUp()).thenReturn(true);
        when(python.execute(anyString(), any(Map.class), any())).thenReturn("ACME-1");
        givenScriptEngines(python);
        String definition = new GlobalScript("python3", "return prefix + '-' + str(len(extra))",
                List.of(new GlobalScript.Parameter("prefix", null, true, null))).toJson();
        ExecutionManager manager = aScriptManager(aScriptSnapshot(definition),
                anEnhancementWithArgs("python3", "RESULT_VAR = VAR_1(VAR_0, 1)",
                        Map.of("VAR_0", "{{global.tenantPrefix}}", "VAR_1", "{{global.formatDate}}")),
                Duration.ofSeconds(5));

        assertThat(manager.executeScript("b1")).isEqualTo("ACME-1");

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, String>> names = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<Function<String, Object>> values = ArgumentCaptor.forClass(Function.class);
        verify(python).execute(code.capture(), names.capture(), values.capture());
        assertThat(code.getValue()).startsWith("def _oc_import_VAR_1():")
                .contains("VAR_1 = _oc_import_VAR_1()")
                .endsWith("RESULT_VAR = VAR_1(VAR_0, 1)");
        assertThat(names.getValue()).containsExactly(Map.entry("VAR_0", "VAR_0"));
        assertThat(values.getValue().apply("VAR_0")).isEqualTo("ACME");
    }

    @Test
    @DisplayName("executeScript — a Ruby script is defined as a method before the code of a ruby enhancement")
    @SuppressWarnings("unchecked")
    void executeScriptDefinesRubyMethodWhenRubyEnhancementImportsIt() throws Exception {
        PolyglotEngine ruby = mock(PolyglotEngine.class);
        when(ruby.supports(any())).thenReturn(true);
        when(ruby.isUp()).thenReturn(true);
        when(ruby.execute(anyString(), any(Map.class), any())).thenReturn("ACME");
        givenScriptEngines(ruby);
        String definition = new GlobalScript("ruby", "prefix", List.of(new GlobalScript.Parameter("prefix", null, true,
                null))).toJson();
        ExecutionManager manager = aScriptManager(aScriptSnapshot(definition),
                anEnhancementWithArgs("ruby", "RESULT_VAR = VAR_1(VAR_0)",
                        Map.of("VAR_0", "{{global.tenantPrefix}}", "VAR_1", "{{global.formatDate}}")),
                Duration.ofSeconds(5));

        assertThat(manager.executeScript("b1")).isEqualTo("ACME");

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(ruby).execute(code.capture(), any(Map.class), any());
        assertThat(code.getValue()).contains("Object.send(:define_method, :VAR_1)")
                .endsWith("end.call\nRESULT_VAR = VAR_1(VAR_0)");
    }

    @Test
    @DisplayName("executeScript — an enhancement that imports a script is stopped once its time limit passes")
    void executeScriptThrowsWhenImportingEnhancementRunsTooLong() {
        givenScriptEngines();
        String looping = new GlobalScript("js", "while (true) {}\nreturn 1;", List.of()).toJson();
        ExecutionManager manager = aScriptManager(aScriptSnapshot(looping),
                anEnhancementWithArgs("js", "RESULT_VAR = VAR_1();", Map.of("VAR_1", "{{global.formatDate}}")),
                Duration.ofMillis(300));

        assertThatThrownBy(() -> manager.executeScript("b1"))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("field binding b1 ran longer than 300 ms");
    }

    @Test
    @DisplayName("executeScript — the limit covers the whole enhancement, so its own code is stopped after a quick script call")
    void executeScriptThrowsWhenImportingEnhancementRunsTooLongAfterScriptReturns() {
        givenScriptEngines();
        ExecutionManager manager = aScriptManager(aScriptSnapshot(FORMAT_DATE_DEFINITION),
                anEnhancementWithArgs("js", "var day = VAR_1('2026-11-17T22:00:00Z');\nwhile (true) {}",
                        Map.of("VAR_1", "{{global.formatDate}}")),
                Duration.ofMillis(300));

        assertThatThrownBy(() -> manager.executeScript("b1"))
                .isInstanceOf(GlobalScript.TimeLimitExceeded.class)
                .hasMessage("The enhancement of field binding b1 ran longer than 300 ms and was stopped");
    }

    @Test
    @DisplayName("executeScript — a python3 enhancement that imports a script is stopped at the limit too")
    @SuppressWarnings("unchecked")
    void executeScriptThrowsWhenPolyglotEnhancementImportingScriptRunsTooLong() {
        CountDownLatch never = new CountDownLatch(1);
        PolyglotEngine python = mock(PolyglotEngine.class);
        when(python.supports(any())).thenReturn(true);
        when(python.isUp()).thenReturn(true);
        when(python.execute(anyString(), any(Map.class), any())).thenAnswer(invocation -> {
            never.await();
            return "late";
        });
        givenScriptEngines(python);
        String definition = new GlobalScript("python3", "return prefix",
                List.of(new GlobalScript.Parameter("prefix", null, true, null))).toJson();
        ExecutionManager manager = aScriptManager(aScriptSnapshot(definition),
                anEnhancementWithArgs("python3", "RESULT_VAR = VAR_1(VAR_0)",
                        Map.of("VAR_0", "{{global.tenantPrefix}}", "VAR_1", "{{global.formatDate}}")),
                Duration.ofMillis(300));

        try {
            assertThatThrownBy(() -> manager.executeScript("b1"))
                    .isInstanceOf(GlobalScript.TimeLimitExceeded.class)
                    .hasMessage("The enhancement of field binding b1 ran longer than 300 ms and was stopped");
        } finally {
            never.countDown();
        }
    }

    @Test
    @DisplayName("getValue — a script has no value: {{global.formatDate}} outside enhancement args fails")
    void getValueThrowsWhenReferenceNamesScriptVariable() {
        ExecutionManager manager = aScriptManager(aScriptSnapshot(FORMAT_DATE_DEFINITION),
                anEnhancementWithArgs("js", "", Map.of()), Duration.ofSeconds(5));

        // the reference extractor wraps the resolver's error, keeping its message
        assertThatThrownBy(() -> manager.getValue("{{global.formatDate}}"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("'formatDate' is a script and has no value to read");
    }

    /** A snapshot with the constant tenantPrefix = "ACME" and the script variable formatDate. */
    private static GlobalVariableSnapshot aScriptSnapshot(String definition) {
        try {
            return GlobalVariableSnapshot.of(List.of(anEntry("tenantPrefix", "\"ACME\""),
                    GlobalVariableSnapshot.Entry.ofScript("formatDate", 1, JSON.readTree(definition), true)));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(definition, e);
        }
    }

    /** Field binding b1 with an enhancement in {@code language} and the given args. */
    private static FieldBindEx anEnhancementWithArgs(String language, String script, Map<String, String> args) {
        FieldBindEx binding = anEnhancement("b1", language, script);
        binding.getEnhance().setArgs(args);
        return binding;
    }

    /** A manager with one field binding, whose run gives an importing enhancement {@code limit}. */
    private static ExecutionManager aScriptManager(GlobalVariableSnapshot snapshot, FieldBindEx binding, Duration limit) {
        GlobalVariableWriter.Run run = new GlobalVariableWriter(mock(GlobalVariableRepository.class),
                mock(GlobalVariableChangeRepository.class), new TestRunOrigins(), 1024, limit.toMillis(),
                GlobalVariableWriter.DEFAULT_MAX_RUN_ENTRIES).forRun(OWNER_WORKFLOW, 900L);

        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(binding), Map.of(CONNECTOR_ID, Map.of()), Map.of(), Map.of(),
                snapshot, run, ReferenceExtractor::new);
        manager.setCurrentCtorId(CONNECTOR_ID);
        return manager;
    }
}
