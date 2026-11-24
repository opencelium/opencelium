package com.becon.opencelium.backend.unit.scriptengine.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionRequest;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ErrorType;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ScriptExecutionErrorDTO;
import com.becon.opencelium.backend.scriptengine.client.ScriptRunServiceImpl;
import com.becon.opencelium.backend.scriptengine.client.ScriptValidationServiceImpl;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;

/**
 * Unit tests for {@link ScriptRunServiceImpl}.
 *
 * <p>No Spring context and no mocks: the service runs scripts on a real {@link NashornEngine},
 * and the syntax check is the real {@link ScriptValidationServiceImpl} with an engine manager
 * that always hands out that engine. Results, error messages and the sandbox are Nashorn's own
 * behavior, which stubs could not reproduce.
 *
 * <p>Run with: ./gradlew test --tests "*.ScriptRunServiceImplTest"
 */
@DisplayName("ScriptRunServiceImpl — unit")
class ScriptRunServiceImplTest {

  private static final NashornEngine NASHORN = new NashornEngine();
  private static final String ENDLESS_LOOP = "while (true) {}";

  private final ScriptRunServiceImpl service = newService(Duration.ofSeconds(5), 2);

  // ── results ────────────────────────────────────────────────────────────────

  @Test
  void runReturnsSumWhenVariablesAreNumbers() {
    ScriptExecutionResultDTO result =
        run("RESULT_VAR = VAR_0 + VAR_1", Map.of("VAR_0", 10, "VAR_1", 7));

    assertThat(result.success()).isTrue();
    assertThat(result.language()).isEqualTo("js");
    assertThat(((Number) result.result()).doubleValue()).isEqualTo(17.0);
    assertThat(result.resultType()).isEqualTo("number");
    assertThat(result.error()).isNull();
  }

  @Test
  void runReadsPropertyWhenVariableIsObject() {
    ScriptExecutionResultDTO result = run("VAR_0.id * 2", Map.of("VAR_0", Map.of("id", 7)));

    assertThat(((Number) result.result()).doubleValue()).isEqualTo(14.0);
  }

  @Test
  void runReturnsListWhenScriptEndsWithArray() {
    ScriptExecutionResultDTO result = run("[VAR_0, 'a']", Map.of("VAR_0", "x"));

    assertThat(result.result()).isEqualTo(List.of("x", "a"));
    assertThat(result.resultType()).isEqualTo("array");
  }

  @Test
  void runReturnsMapWhenScriptEndsWithObject() {
    ScriptExecutionResultDTO result = run("({name: VAR_0})", Map.of("VAR_0", "x"));

    assertThat(result.result()).isEqualTo(Map.of("name", "x"));
    assertThat(result.resultType()).isEqualTo("object");
  }

  @ParameterizedTest(name = "{0} -> {1}")
  @CsvSource(
      delimiter = '|',
      quoteCharacter = '"',
      value = {"'abc' | string", "1 > 0 | boolean", "null | null", "var x = 1; | null"})
  void runReportsResultTypeWhenScriptEndsWithValue(String script, String expectedType) {
    ScriptExecutionResultDTO result = run(script, Map.of());

    assertThat(result.success()).isTrue();
    assertThat(result.resultType()).isEqualTo(expectedType);
  }

  @Test
  @DisplayName("run — a Long variable is a JS number, not a Java object")
  void runBindsLongAsNumberWhenVariableIsLong() {
    ScriptExecutionResultDTO result = run("typeof VAR_0", Map.of("VAR_0", 5L));

    assertThat(result.result()).isEqualTo("number");
  }

  @Test
  void runBindsNullWhenVariableValueIsNull() {
    Map<String, Object> variables = new HashMap<>();
    variables.put("VAR_0", null);

    ScriptExecutionResultDTO result = run("VAR_0 === null", variables);

    assertThat(result.result()).isEqualTo(true);
  }

  @Test
  @DisplayName("run — RESULT_VAR is not injected, as in a real execution")
  void runIgnoresResultVarWhenItIsProvidedAsVariable() {
    ScriptExecutionResultDTO result =
        run("typeof RESULT_VAR", Map.of("RESULT_VAR", "#6477AB.(request).body.$.id"));

    assertThat(result.result()).isEqualTo("undefined");
  }

  // ── output ─────────────────────────────────────────────────────────────────

  @Test
  void runCapturesOutputWhenScriptPrints() {
    ScriptExecutionResultDTO result = run("print('step ' + VAR_0); 1", Map.of("VAR_0", 1));

    assertThat(result.output()).isEqualTo("step 1\n");
  }

  @Test
  void runTruncatesOutputWhenPrintExceedsLimit() {
    String script = "for (var i = 0; i < 700; i++) { print(new Array(101).join('x')); } 1";

    ScriptExecutionResultDTO result = run(script, Map.of());

    assertThat(result.output())
        .hasSize(65_536 + "\n[output truncated at 65536 characters]".length())
        .endsWith("[output truncated at 65536 characters]");
  }

  // ── failures ───────────────────────────────────────────────────────────────

  @Test
  void runReturnsSyntaxErrorWhenScriptDoesNotCompile() {
    ScriptExecutionErrorDTO error = failure(run("let x = 1;", Map.of()));

    assertThat(error.type()).isEqualTo(ErrorType.SYNTAX);
    assertThat(error.name()).isEqualTo("SyntaxError");
    assertThat(error.line()).isEqualTo(1);
    assertThat(error.column()).isEqualTo(5);
    assertThat(error.hint()).startsWith("'let' declarations cannot be used");
  }

  @Test
  void runHintsMissingVariableWhenVariableIsNotProvided() {
    ScriptExecutionErrorDTO error = failure(run("VAR_0 + VAR_2", Map.of("VAR_0", 1)));

    assertThat(error.type()).isEqualTo(ErrorType.RUNTIME);
    assertThat(error.name()).isEqualTo("ReferenceError");
    assertThat(error.message()).isEqualTo("\"VAR_2\" is not defined");
    assertThat(error.line()).isEqualTo(1);
    assertThat(error.column()).isNull();
    assertThat(error.codeLine()).isEqualTo("VAR_0 + VAR_2");
    assertThat(error.hint()).startsWith("'VAR_2' is not defined");
  }

  @Test
  void runReportsLineWhenRuntimeErrorIsOnLaterLine() {
    ScriptExecutionErrorDTO error = failure(run("var x = 1;\nfoo();", Map.of()));

    assertThat(error.line()).isEqualTo(2);
    assertThat(error.codeLine()).isEqualTo("foo();");
  }

  @Test
  void runHintsUndefinedValueWhenPropertyOfUndefinedIsRead() {
    ScriptExecutionErrorDTO error = failure(run("var a; a.b.c", Map.of()));

    assertThat(error.name()).isEqualTo("TypeError");
    assertThat(error.message()).isEqualTo("Cannot read property \"b\" from undefined");
    assertThat(error.hint()).startsWith("The value whose 'b' is accessed is undefined");
  }

  @Test
  void runHintsNullValueWhenPropertyOfNullIsSet() {
    ScriptExecutionErrorDTO error = failure(run("var a = null; a.x = 1", Map.of()));

    assertThat(error.hint()).startsWith("The value whose 'x' is accessed is null");
  }

  @Test
  void runHintsEs5MethodsWhenMethodIsNotAFunction() {
    ScriptExecutionErrorDTO error = failure(run("VAR_0.includes('a')", Map.of("VAR_0", "abc")));

    assertThat(error.name()).isEqualTo("TypeError");
    assertThat(error.hint()).contains("is not a function").contains("ES5.1");
  }

  @Test
  void runHintsParsedVariablesWhenJsonParseGetsObject() {
    ScriptExecutionErrorDTO error =
        failure(run("JSON.parse(VAR_0)", Map.of("VAR_0", Map.of("a", 1))));

    assertThat(error.name()).isEqualTo("SyntaxError");
    assertThat(error.type()).isEqualTo(ErrorType.RUNTIME);
    assertThat(error.hint()).contains("already parsed");
  }

  @Test
  void runReportsThrownErrorWhenScriptThrows() {
    ScriptExecutionErrorDTO error = failure(run("throw new Error('no order id')", Map.of()));

    assertThat(error.name()).isEqualTo("Error");
    assertThat(error.message()).isEqualTo("no order id");
    assertThat(error.hint()).startsWith("The script threw this error itself");
  }

  @Test
  void runReturnsResultErrorWhenScriptEndsWithFunction() {
    ScriptExecutionErrorDTO error = failure(run("(function () {})", Map.of()));

    assertThat(error.type()).isEqualTo(ErrorType.RESULT);
    assertThat(error.hint()).contains("Functions, dates and other special objects");
  }

  @Test
  void runReturnsRuntimeErrorWhenScriptUsesJavaType() {
    ScriptExecutionErrorDTO error =
        failure(run("Java.type('java.lang.System').getProperty('user.home')", Map.of()));

    assertThat(error.type()).isEqualTo(ErrorType.RUNTIME);
    assertThat(error.message()).isEqualTo("\"Java\" is not defined");
  }

  // ── time limit and concurrency ─────────────────────────────────────────────

  @Test
  void runReturnsTimeoutWhenScriptLoopsForever() {
    ScriptRunServiceImpl fastService = newService(Duration.ofMillis(300), 2);

    ScriptExecutionResultDTO result =
        fastService.run(new ScriptExecutionRequest("js", ENDLESS_LOOP, Map.of()));

    ScriptExecutionErrorDTO error = failure(result);
    assertThat(error.type()).isEqualTo(ErrorType.TIMEOUT);
    assertThat(error.message()).contains("300 ms");
    assertThat(result.durationMs()).isGreaterThanOrEqualTo(300);
  }

  @Test
  @DisplayName("run — the slot of a timed-out script is freed once its thread is stopped")
  void runFreesSlotWhenTimedOutScriptIsStopped() {
    ScriptRunServiceImpl singleSlot = newService(Duration.ofMillis(300), 1);
    singleSlot.run(new ScriptExecutionRequest("js", ENDLESS_LOOP, Map.of()));

    await()
        .atMost(Duration.ofSeconds(5))
        .untilAsserted(
            () ->
                assertThat(
                        singleSlot.run(new ScriptExecutionRequest("js", "1", Map.of())).success())
                    .isTrue());
  }

  @Test
  void runThrowsTooManyScriptRunsWhenAllSlotsAreBusy() {
    ScriptRunServiceImpl singleSlot = newService(Duration.ofSeconds(2), 1);
    CompletableFuture<ScriptExecutionResultDTO> busy =
        CompletableFuture.supplyAsync(
            () -> singleSlot.run(new ScriptExecutionRequest("js", ENDLESS_LOOP, Map.of())));

    await()
        .atMost(Duration.ofSeconds(2))
        .untilAsserted(
            () ->
                assertThatThrownBy(
                        () -> singleSlot.run(new ScriptExecutionRequest("js", "1", Map.of())))
                    .isInstanceOfSatisfying(
                        GeneralServiceException.class,
                        e -> {
                          assertThat(e.getError()).isEqualTo("TOO_MANY_SCRIPT_RUNS");
                          assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                        }));

    assertThat(busy.join().error().type()).isEqualTo(ErrorType.TIMEOUT);
  }

  // ── invalid requests ───────────────────────────────────────────────────────

  @ParameterizedTest
  @ValueSource(strings = {"", "1abc", "a-b", "my var", "var", "undefined"})
  void runThrowsInvalidVariableNameWhenNameIsNotIdentifier(String name) {
    assertThatThrownBy(() -> run("1", Map.of(name, 1)))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> {
              assertThat(e.getError()).isEqualTo("INVALID_VARIABLE_NAME");
              assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            })
        .hasMessageContaining("'" + name + "'");
  }

  @Test
  void runThrowsVariablesTooLargeWhenVariablesExceedLimit() {
    Map<String, Object> variables = Map.of("VAR_0", "a".repeat(1_000_000));

    assertThatThrownBy(() -> run("1", variables))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> assertThat(e.getError()).isEqualTo("VARIABLES_TOO_LARGE"))
        .hasMessageContaining("1000000");
  }

  @Test
  void runThrowsScriptIsEmptyWhenRequestIsNull() {
    assertThatThrownBy(() -> service.run(null))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> assertThat(e.getError()).isEqualTo("SCRIPT_IS_EMPTY"));
  }

  @Test
  void runThrowsUnsupportedLanguageWhenLanguageIsPython() {
    ScriptExecutionRequest request = new ScriptExecutionRequest("python3", "x = 1", Map.of());

    assertThatThrownBy(() -> service.run(request))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> assertThat(e.getError()).isEqualTo("UNSUPPORTED_LANGUAGE"))
        .hasMessageContaining("python3");
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private static ScriptRunServiceImpl newService(Duration timeout, int maxConcurrentRuns) {
    ScriptValidationServiceImpl validation =
        new ScriptValidationServiceImpl(language -> Optional.of(NASHORN));
    return new ScriptRunServiceImpl(validation, NASHORN, timeout, maxConcurrentRuns);
  }

  private ScriptExecutionResultDTO run(String script, Map<String, Object> variables) {
    return service.run(new ScriptExecutionRequest("js", script, variables));
  }

  private static ScriptExecutionErrorDTO failure(ScriptExecutionResultDTO result) {
    assertThat(result.success()).isFalse();
    assertThat(result.result()).isNull();
    assertThat(result.resultType()).isNull();
    return result.error();
  }
}
