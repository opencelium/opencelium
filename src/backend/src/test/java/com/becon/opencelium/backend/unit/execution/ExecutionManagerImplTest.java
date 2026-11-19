package com.becon.opencelium.backend.unit.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

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
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
}
