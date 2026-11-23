package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalValueResolver;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for {@link GlobalValueResolver}: reading a value, and a path into it, from the
 * snapshot of a run.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalValueResolverTest"
 */
@DisplayName("GlobalValueResolver — unit")
class GlobalValueResolverTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static final GlobalVariableSnapshot SNAPSHOT = GlobalVariableSnapshot.of(List.of(
            anEntry("name", "\"acme\""),
            anEntry("nothing", "null"),
            anEntry("config", "{\"limits\":{\"maxPerPage\":50},\"enabled\":true}"),
            anEntry("tenants", "[{\"id\":\"acme\"},{\"id\":\"globex\"}]"),
            anEntry("regions", "{\"eu-west.1\":{\"url\":\"https://eu.example.test\"},\"a]b\":7}")));

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("valuesOfEveryJsonType")
    void resolveReturnsWholeValueWhenReferenceHasNoPath(String json, Object expected) {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(anEntry("value", json)));

        Object value = GlobalValueResolver.resolve(snapshot, GlobalReference.parse("{{global.value}}"));

        assertThat(value).isEqualTo(expected);
    }

    static Stream<Arguments> valuesOfEveryJsonType() {
        return Stream.of(
                Arguments.of("\"text\"", "text"),
                Arguments.of("42", 42),
                Arguments.of("1.5", 1.5),
                Arguments.of("true", true),
                Arguments.of("[\"a\",2]", List.of("a", 2)),
                Arguments.of("{\"a\":{\"b\":1}}", Map.of("a", Map.of("b", 1))));
    }

    @Test
    void resolveReturnsNestedFieldWhenPathFollowsDots() {
        Object value = resolve("{{global.config.limits.maxPerPage}}");

        assertThat(value).isEqualTo(50);
    }

    @Test
    void resolveReturnsArrayElementWhenPathHasIndex() {
        Object value = resolve("{{global.tenants[1].id}}");

        assertThat(value).isEqualTo("globex");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("quotedKeys")
    @DisplayName("resolve — a quoted key may hold a dot or a bracket")
    void resolveReturnsValueWhenKeyIsQuoted(String reference, Object expected) {
        Object value = resolve(reference);

        assertThat(value).isEqualTo(expected);
    }

    static Stream<Arguments> quotedKeys() {
        return Stream.of(
                Arguments.of("{{global.regions['eu-west.1'].url}}", "https://eu.example.test"),
                Arguments.of("{{global.regions[\"eu-west.1\"].url}}", "https://eu.example.test"),
                Arguments.of("{{global.regions['a]b']}}", 7));
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {
            "{{global.config.missing}}",          // missing key
            "{{global.config.missing.deeper}}",   // path goes on after a missing key
            "{{global.tenants[9]}}",              // index past the end
            "{{global.tenants[9].id}}",           // field of an element past the end
            "{{global.name.length}}",             // field of a string
            "{{global.config[0]}}",               // index into a map
            "{{global.tenants.id}}",              // field of an array
    })
    void resolveReturnsNullWhenPathLeadsNowhere(String reference) {
        Object value = resolve(reference);

        assertThat(value).isNull();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {"{{global.nothing}}", "{{global.nothing.field}}"})
    void resolveReturnsNullWhenValueIsJsonNull(String reference) {
        Object value = resolve(reference);

        assertThat(value).isNull();
    }

    @Test
    @DisplayName("resolve — an unknown variable is an error, never an empty value")
    void resolveThrowsGlobalVariableNotFoundExceptionWhenSnapshotLacksVariable() {
        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> resolve("{{global.idoitUrl.host}}"), GlobalVariableNotFoundException.class);

        assertThat(notFound.getName()).isEqualTo("idoitUrl");
        assertThat(notFound)
                .hasMessageContaining("'idoitUrl'")
                .hasMessageContaining("does not exist or this workflow is outside its scope");
    }

    @Test
    @DisplayName("resolve — names are matched exactly, so another case is another variable")
    void resolveThrowsGlobalVariableNotFoundExceptionWhenCaseDiffers() {
        assertThatThrownBy(() -> resolve("{{global.Name}}"))
                .isInstanceOf(GlobalVariableNotFoundException.class)
                .hasMessageContaining("'Name'");
    }

    @Test
    void resolveThrowsIllegalArgumentExceptionWhenIndexIsNeitherNumberNorKey() {
        assertThatThrownBy(() -> resolve("{{global.tenants[i].id}}"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("[i]")
                .hasMessageContaining("{{global.tenants[i].id}}");
    }

    @Test
    void resolveThrowsIllegalArgumentExceptionWhenBracketIsUnclosed() {
        assertThatThrownBy(() -> resolve("{{global.tenants[0}}"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unclosed '['")
                .hasMessageContaining("{{global.tenants[0}}");
    }

    @Test
    @DisplayName("resolve — a caller that changes a result does not change the snapshot")
    @SuppressWarnings("unchecked")
    void resolveReturnsFreshValueWhenCallerChangesEarlierResult() {
        List<Object> first = (List<Object>) resolve("{{global.tenants}}");
        first.clear();

        Object second = resolve("{{global.tenants}}");

        assertThat(second).isEqualTo(List.of(Map.of("id", "acme"), Map.of("id", "globex")));
    }

    @Test
    @DisplayName("resolve — a map has no positions: a number in brackets is its key of that name")
    void resolveReturnsMapEntryWhenIndexIsNumericKey() {
        GlobalVariableSnapshot snapshot =
                GlobalVariableSnapshot.of(List.of(anEntry("codes", "{\"200\":\"ok\",\"404\":\"missing\"}")));

        Object value = GlobalValueResolver.resolve(snapshot, GlobalReference.parse("{{global.codes[404]}}"));

        assertThat(value).isEqualTo("missing");
    }

    @Test
    @DisplayName("resolve — a path the caller prepared is read as it is, whatever the reference says")
    void resolveReadsPreparedPathWhenCallerGivesOne() {
        Object value = GlobalValueResolver.resolve(SNAPSHOT, "tenants", "[1].id", "{{global.tenants[i].id}}");

        assertThat(value).isEqualTo("globex");
    }

    @Test
    void resolveForConnectorReturnsValueWhenVariableIsOpenToAll() {
        Object value = GlobalValueResolver.resolveForConnector(
                SNAPSHOT, GlobalReference.parse("{{global.config.limits.maxPerPage}}"));

        assertThat(value).isEqualTo(50);
    }

    @Test
    @DisplayName("resolveForConnector — a connector is shared by every workflow, so a scoped variable is not for it")
    void resolveForConnectorThrowsGlobalVariableNotFoundExceptionWhenVariableIsScoped() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(aScopedEntry("apiKey", "\"k3y\"")));

        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> GlobalValueResolver.resolveForConnector(snapshot, GlobalReference.parse("{{global.apiKey}}")),
                GlobalVariableNotFoundException.class);

        assertThat(notFound)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("is not open to all workflows");
        assertThat(notFound.getName()).isEqualTo("apiKey");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static Object resolve(String reference) {
        return GlobalValueResolver.resolve(SNAPSHOT, GlobalReference.parse(reference));
    }

    /** The entry of a variable that only some workflows may use. */
    private static GlobalVariableSnapshot.Entry aScopedEntry(String name, String json) {
        GlobalVariableSnapshot.Entry open = anEntry(name, json);

        return new GlobalVariableSnapshot.Entry(open.name(), open.version(), open.value(), false);
    }

    private static GlobalVariableSnapshot.Entry anEntry(String name, String json) {
        try {
            return new GlobalVariableSnapshot.Entry(name, 1, JSON.readTree(json));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(json, e);
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @DisplayName("resolve — a script has no value, read by a workflow or by a connector")
    void resolveThrowsWhenVariableIsScript(boolean connector) throws JsonProcessingException {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(GlobalVariableSnapshot.Entry.ofScript(
                "formatDate", 1, new ObjectMapper().readTree("{\"language\":\"js\",\"code\":\"return 1;\"}"), true)));
        GlobalReference reference = GlobalReference.parse("{{global.formatDate}}");

        assertThatThrownBy(() -> {
            if (connector) {
                GlobalValueResolver.resolveForConnector(snapshot, reference);
            } else {
                GlobalValueResolver.resolve(snapshot, reference);
            }
        }).isInstanceOf(IllegalStateException.class).hasMessageContaining("'formatDate' is a script");
    }
}
