package com.becon.opencelium.backend.unit.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import org.assertj.core.api.InstanceOfAssertFactories;

import java.io.StringWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link NashornEngine}.
 *
 * No Spring context is loaded. The engine is instantiated directly.
 * Run with: ./gradlew test
 */
@DisplayName("NashornEngine — unit")
class NashornEngineTest {

    private NashornEngine engine;

    @BeforeEach
    void setUp() {
        engine = new NashornEngine();
    }

    // ── execute — no bindings ─────────────────────────────────────────────────

    @Test
    void executeReturnsResultWhenBindingsAreAbsent() {
        assertThat(engine.execute("1 + 2")).isEqualTo(3);
    }

    @Test
    void executeReturnsPrimitiveWhenBindingsAreNull() {
        assertThat(((Number) engine.execute("1 + 2", null)).intValue()).isEqualTo(3);
    }

    @Test
    void executeReturnsNullWhenScriptResultIsNull() {
        assertThat(engine.execute("null", null)).isNull();
    }

    // ── execute — primitive bindings ──────────────────────────────────────────

    @Test
    void executeReturnsResultWhenBindingIsPrimitive() {
        assertThat(engine.execute("a + 5", Map.of("a", 10))).isEqualTo(15.0);
    }

    @Test
    void executeReturnsConcatenatedStringWhenBindingIsString() {
        assertThat(engine.execute("greeting + ', world!'", Map.of("greeting", "Hello")))
                .isEqualTo("Hello, world!");
    }

    @Test
    void executeReturnsStringWhenBindingIsNull() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("name", null);

        assertThat(engine.execute("'Hello ' + name", bindings)).isEqualTo("Hello null");
    }

    // ── execute — collection and object bindings ──────────────────────────────

    @Test
    void executeReadsObjectPropertiesWhenBindingIsMap() {
        assertThat(engine.execute(
                "user.name + ' is ' + user.age + ' years old'",
                Map.of("user", Map.of("name", "Alice", "age", 30))
        )).isEqualTo("Alice is 30 years old");
    }

    @Test
    void executeReturnsSumWhenBindingIsList() {
        assertThat(engine.execute("data[0] + data[1]", Map.of("data", List.of(3, 4)))).isEqualTo(7.0);
    }

    @Test
    void executeReturnsArrayLengthWhenBindingIsList() {
        assertThat(((Number) engine.execute("items.length", Map.of("items", List.of(1, 2, 3)))).intValue())
                .isEqualTo(3);
    }

    @Test
    void executeReturnsMappedValueWhenBindingIsMap() {
        assertThat(((Number) engine.execute("myMap.value", Map.of("myMap", Map.of("value", 42)))).intValue())
                .isEqualTo(42);
    }

    // ── execute — script evaluates to collection or object ───────────────────

    @Test
    void executeReturnsListWhenScriptEvaluatesToArray() {
        assertThat(engine.execute("[1, 2, 3]"))
                .asInstanceOf(InstanceOfAssertFactories.LIST)
                .containsExactly(1, 2, 3);
    }

    @Test
    void executeReturnsMapWhenScriptEvaluatesToObject() {
        assertThat(engine.execute("({ city: 'Tashkent', population: 2500000 })"))
                .asInstanceOf(InstanceOfAssertFactories.map(String.class, Object.class))
                .containsEntry("city", "Tashkent")
                .containsEntry("population", 2500000);
    }

    // ── execute — reference extractor ─────────────────────────────────────────

    @Test
    void executeReplacesReferenceValuesWhenExpressionContainsThem() {
        String ref = "{%#ffffff.(request).url%}";
        String url = "https://www.google.com";
        Map<String, Object> referenceValues = Map.of(ref, url);

        assertThat(engine.execute("a + 'a'", Map.of("a", ref), referenceValues::get))
                .isEqualTo(url + "a");
    }

    @Test
    void executeReturnsMapWhenReferenceResolvesToObject() {
        String ref = "{%#ffffff.(response).success.user%}";
        Map<String, Object> referenceValues =
                Map.of(ref, Map.of("name", "Alice", "roles", List.of("admin", "dev")));

        assertThat(engine.execute(
                "({name: u.name.toUpperCase(), roles: u.roles.join(',')})",
                Map.of("u", ref),
                referenceValues::get))
                .isEqualTo(Map.of("name", "ALICE", "roles", "admin,dev"));
    }

    // ── execute — Java-typed bindings ─────────────────────────────────────────

    @Test
    void executeReturnsSumWhenBindingIsLong() {
        assertThat(((Number) engine.execute("n + 1", Map.of("n", 41L))).intValue()).isEqualTo(42);
    }

    @Test
    void executeReturnsNegationWhenBindingIsBoolean() {
        assertThat(engine.execute("!flag", Map.of("flag", true))).isEqualTo(false);
    }

    @Test
    void executeCallsStringMethodsWhenBindingIsString() {
        assertThat(engine.execute("s.toUpperCase().split('-').length", Map.of("s", "a-b-c")))
                .isEqualTo(3);
    }

    @Test
    void executeReturnsStringWhenBindingIsLongConvertedToString() {
        assertThat(engine.execute("'' + n", Map.of("n", 7L))).isEqualTo("7");
    }

    // ── execute — errors ──────────────────────────────────────────────────────

    @Test
    void executeThrowsScriptExecutionExceptionWhenScriptHasSyntaxError() {
        assertThatThrownBy(() -> engine.execute("function() {", null))
                .isInstanceOf(ScriptExecutionException.class);
    }

    // ── execute — sandbox ─────────────────────────────────────────────────────

    @ParameterizedTest(name = "{0}")
    @MethodSource("escapingScripts")
    void executeThrowsWhenScriptEscapesSandbox(String script, String undefinedName) {
        assertThatThrownBy(() -> engine.execute(script))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"" + undefinedName + "\" is not defined");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("escapingScripts")
    void executeWithBindingsThrowsWhenScriptEscapesSandbox(String script, String undefinedName) {
        assertThatThrownBy(() -> engine.execute(script, Map.of("a", 1)))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"" + undefinedName + "\" is not defined");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("escapingScripts")
    void executeWithReferenceExtractorThrowsWhenScriptEscapesSandbox(
            String script, String undefinedName) {
        assertThatThrownBy(() -> engine.execute(script, Map.of("a", "ref"), ref -> 1))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"" + undefinedName + "\" is not defined");
    }

    @Test
    void executeReturnsResultWithoutWritingWhenScriptPrints() {
        assertThat(engine.execute("print('hello'); 1 + 2")).isEqualTo(3);
    }

    static Stream<Arguments> escapingScripts() {
        return Stream.of(
                Arguments.of("Java.type('java.lang.Runtime').getRuntime()", "Java"),
                Arguments.of("java.lang.System.getProperty('user.home')", "java"),
                Arguments.of("Packages.java.lang.System.getProperty('user.home')", "Packages"),
                Arguments.of("exit(1)", "exit"),
                Arguments.of("quit()", "quit"),
                Arguments.of("load('http://localhost/script.js')", "load"),
                Arguments.of("loadWithNewGlobal('http://localhost/script.js')", "loadWithNewGlobal"));
    }

    // ── validate ──────────────────────────────────────────────────────────────

    @Test
    void validateDoesNotThrowWhenScriptIsValid() {
        assertThatCode(() -> engine.validate("var x = 10;")).doesNotThrowAnyException();
    }

    @Test
    void validateThrowsInvalidScriptExceptionWhenScriptHasSyntaxError() {
        assertThatThrownBy(() -> engine.validate("function() {"))
                .isInstanceOf(InvalidScriptException.class);
    }

    // ── executeSandboxed ──────────────────────────────────────────────────────

    @Test
    void executeSandboxedThrowsWhenScriptUsesJavaType() {
        assertThatThrownBy(() -> engine.executeSandboxed(
                "Java.type('java.lang.System').getProperty('user.home')", null, new StringWriter()))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"Java\" is not defined");
    }

    @Test
    void executeSandboxedThrowsWhenScriptUsesJavaPackages() {
        assertThatThrownBy(() -> engine.executeSandboxed(
                "java.lang.System.getProperty('user.home')", null, new StringWriter()))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"java\" is not defined");
    }

    @Test
    @DisplayName("executeSandboxed — exit() is removed instead of terminating the JVM")
    void executeSandboxedThrowsWhenScriptCallsExit() {
        assertThatThrownBy(() -> engine.executeSandboxed("exit(1)", null, new StringWriter()))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"exit\" is not defined");
    }

    @Test
    void executeSandboxedThrowsWhenScriptCallsQuit() {
        assertThatThrownBy(() -> engine.executeSandboxed("quit()", null, new StringWriter()))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"quit\" is not defined");
    }

    @Test
    void executeSandboxedThrowsWhenScriptCallsLoad() {
        assertThatThrownBy(() -> engine.executeSandboxed(
                "load('http://localhost/script.js')", null, new StringWriter()))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("\"load\" is not defined");
    }

    @Test
    void executeSandboxedWritesPrintOutputWhenScriptPrints() {
        StringWriter output = new StringWriter();

        engine.executeSandboxed("print('hello'); 1", null, output);

        assertThat(output.toString()).isEqualTo("hello\n");
    }

    @Test
    void executeSandboxedReturnsSameResultAsExecuteWhenBindingIsObject() {
        Map<String, Object> bindings = Map.of("order", Map.of("id", 7, "tags", List.of("a", "b")));
        String script = "({id: order.id * 2, first: order.tags[0]})";

        Object sandboxed = engine.executeSandboxed(script, bindings, new StringWriter());

        assertThat(sandboxed).isEqualTo(engine.execute(script, bindings));
    }
}
