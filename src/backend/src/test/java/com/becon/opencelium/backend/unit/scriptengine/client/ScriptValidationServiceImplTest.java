package com.becon.opencelium.backend.unit.scriptengine.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO.ScriptErrorDTO;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.client.ScriptValidationServiceImpl;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

/**
 * Unit tests for {@link ScriptValidationServiceImpl}.
 *
 * <p>The engine manager is mocked, but it hands out a real {@link NashornEngine}: it compiles
 * in memory and is deterministic, and the hints are derived from Nashorn's own messages, so a
 * stubbed engine would only verify the stubs.
 *
 * <p>Run with: ./gradlew test --tests "*.ScriptValidationServiceImplTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScriptValidationServiceImpl — unit")
class ScriptValidationServiceImplTest {

  private static final NashornEngine NASHORN = new NashornEngine();
  private static final int MAX_SCRIPT_LENGTH = 100_000;

  @Mock private ScriptExecutionManager scriptExecutionManager;

  @InjectMocks private ScriptValidationServiceImpl service;

  // ── valid scripts ──────────────────────────────────────────────────────────

  @Test
  void validateReturnsValidWhenScriptCompiles() {
    givenNashorn();

    ScriptValidationResultDTO result = validateJs("var a = 1;\nvar b = a + 2;");

    assertThat(result.valid()).isTrue();
    assertThat(result.language()).isEqualTo("js");
    assertThat(result.errors()).isEmpty();
  }

  @Test
  void validateDefaultsToJsWhenLanguageIsBlank() {
    givenNashorn();

    ScriptValidationResultDTO result =
        service.validate(new ScriptValidationRequest("  ", "var a = 1;"));

    assertThat(result.valid()).isTrue();
    assertThat(result.language()).isEqualTo("js");
  }

  @Test
  void validateAcceptsScriptWhenLengthEqualsLimit() {
    givenNashorn();
    String statement = "var a = 1;";
    String script = " ".repeat(MAX_SCRIPT_LENGTH - statement.length()) + statement;

    ScriptValidationResultDTO result = validateJs(script);

    assertThat(result.valid()).isTrue();
  }

  // ── position and message ───────────────────────────────────────────────────

  @Test
  @DisplayName("validate — reports the engine's 0-based column as 1-based")
  void validateReportsOneBasedColumnWhenOperandIsMissing() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("var a = 1;\nvar b = a +;"));

    assertThat(error.line()).isEqualTo(2);
    assertThat(error.column()).isEqualTo(12);
    assertThat(error.codeLine()).isEqualTo("var b = a +;");
  }

  @Test
  @DisplayName("validate — drops the <eval>:L:C prefix, code excerpt and position suffix")
  void validateStripsEnginePrefixFromMessageWhenScriptIsInvalid() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("var a = 1;\nvar b = a +;"));

    assertThat(error.message()).isEqualTo("Expected an operand but found ;");
  }

  @Test
  void validateReturnsInvalidResultWhenScriptDoesNotCompile() {
    givenNashorn();

    ScriptValidationResultDTO result = validateJs("var b = a +;");

    assertThat(result.valid()).isFalse();
    assertThat(result.language()).isEqualTo("js");
    assertThat(result.errors()).hasSize(1);
  }

  // ── ES5.1 hints ────────────────────────────────────────────────────────────

  static Stream<Arguments> unsupportedEs6Syntax() {
    return Stream.of(
        Arguments.of("var s = `t`;", "Template literals"),
        Arguments.of("var f = () => 1;", "Arrow functions"),
        Arguments.of("let x = 1;", "'let' declarations"),
        Arguments.of("async function f() {}", "'async' and 'await'"),
        Arguments.of("class A {}", "Classes"),
        Arguments.of("var a = [...b];", "Spread and rest syntax (...)"),
        Arguments.of("for (var x of arr) {}", "'for...of' loops"),
        Arguments.of("var {a} = o;", "Destructuring"),
        Arguments.of("function f(a = 1) {}", "Default parameter values"),
        Arguments.of("var y = a?.b;", "Optional chaining (?.)"),
        Arguments.of("var p = 2 ** 3;", "The ** operator"));
  }

  @ParameterizedTest(name = "{1}: {0}")
  @MethodSource("unsupportedEs6Syntax")
  void validateHintsEs5AlternativeWhenEs6SyntaxIsUsed(String script, String feature) {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs(script));

    assertThat(error.hint())
        .startsWith(feature + " cannot be used")
        .contains("ES5.1");
  }

  // ── generic hints ──────────────────────────────────────────────────────────

  @Test
  void validateHintsReturnWhenReturnIsTopLevel() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("return 5;"));

    assertThat(error.hint()).contains("only allowed inside a function");
  }

  @Test
  void validateHintsClosingQuoteWhenStringIsUnterminated() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("var s = 'abc;"));

    assertThat(error.hint()).contains("string is not closed");
  }

  @Test
  void validateHintsMissingBraceWhenScriptEndsInsideBlock() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("function f() {\n  var a = 1;\n"));

    assertThat(error.hint()).contains("Add the missing '}'");
  }

  @Test
  void validateReportsEmptyCodeLineWhenErrorIsAtEndOfScript() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("function f() {\n  var a = 1;\n"));

    assertThat(error.line()).isEqualTo(3);
    assertThat(error.column()).isEqualTo(1);
    assertThat(error.codeLine()).isEmpty();
  }

  @Test
  void validateHintsStrayBracketWhenClosingBraceIsUnmatched() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("if (a) { b; }}"));

    assertThat(error.hint()).startsWith("'}' has no matching opening bracket");
  }

  @Test
  void validateHintsCommaWhenObjectElementsAreNotSeparated() {
    givenNashorn();

    ScriptErrorDTO error = singleError(validateJs("var o = {a: 1 b: 2};"));

    assertThat(error.hint())
        .contains("must be separated by commas")
        .contains("before a name");
  }

  // ── error branches ─────────────────────────────────────────────────────────

  @ParameterizedTest
  @NullSource
  @ValueSource(strings = {"", "   ", "\n\t"})
  void validateThrowsScriptIsEmptyWhenScriptIsBlank(String script) {
    assertThatThrownBy(() -> validateJs(script))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> {
              assertThat(e.getError()).isEqualTo("SCRIPT_IS_EMPTY");
              assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            })
        .hasMessageContaining("must not be empty");
  }

  @Test
  void validateThrowsScriptIsEmptyWhenRequestIsNull() {
    assertThatThrownBy(() -> service.validate(null))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> assertThat(e.getError()).isEqualTo("SCRIPT_IS_EMPTY"));
  }

  @Test
  void validateThrowsScriptTooLargeWhenScriptExceedsLimit() {
    String script = "a".repeat(MAX_SCRIPT_LENGTH + 1);

    assertThatThrownBy(() -> validateJs(script))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> {
              assertThat(e.getError()).isEqualTo("SCRIPT_TOO_LARGE");
              assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            })
        .hasMessageContaining(String.valueOf(MAX_SCRIPT_LENGTH));
  }

  @Test
  void validateThrowsUnsupportedLanguageWhenLanguageIsPython() {
    ScriptValidationRequest request = new ScriptValidationRequest("python3", "x = 1");

    assertThatThrownBy(() -> service.validate(request))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> {
              assertThat(e.getError()).isEqualTo("UNSUPPORTED_LANGUAGE");
              assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            })
        .hasMessageContaining("python3");
  }

  @Test
  void validateThrowsUnsupportedLanguageWhenLanguageIsUnknown() {
    ScriptValidationRequest request = new ScriptValidationRequest("cobol", "x = 1");

    assertThatThrownBy(() -> service.validate(request))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> assertThat(e.getError()).isEqualTo("UNSUPPORTED_LANGUAGE"))
        .hasMessageContaining("cobol");
  }

  @Test
  void validateThrowsEngineUnavailableWhenNoEngineResolves() {
    given(scriptExecutionManager.resolveEngine(LanguageType.JS)).willReturn(Optional.empty());

    assertThatThrownBy(() -> validateJs("var a = 1;"))
        .isInstanceOfSatisfying(
            GeneralServiceException.class,
            e -> {
              assertThat(e.getError()).isEqualTo("SCRIPT_ENGINE_UNAVAILABLE");
              assertThat(e.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
            })
        .hasMessageContaining("js");
  }

  @Test
  @DisplayName("validate — falls back to a position-less error when the engine gives no ScriptException")
  void validateReturnsGenericHintWhenCauseIsNotScriptException() {
    ScriptEngine engine = mock(ScriptEngine.class);
    doThrow(new InvalidScriptException("boom")).when(engine).validate(anyString());
    given(scriptExecutionManager.resolveEngine(LanguageType.JS)).willReturn(Optional.of(engine));

    ScriptErrorDTO error = singleError(validateJs("var a = 1;"));

    assertThat(error.line()).isNull();
    assertThat(error.column()).isNull();
    assertThat(error.codeLine()).isNull();
    assertThat(error.message()).isEqualTo("boom");
    assertThat(error.hint()).startsWith("Check the syntax");
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private void givenNashorn() {
    given(scriptExecutionManager.resolveEngine(LanguageType.JS)).willReturn(Optional.of(NASHORN));
  }

  private ScriptValidationResultDTO validateJs(String script) {
    return service.validate(new ScriptValidationRequest("js", script));
  }

  private static ScriptErrorDTO singleError(ScriptValidationResultDTO result) {
    assertThat(result.valid()).isFalse();
    assertThat(result.errors()).hasSize(1);
    return result.errors().get(0);
  }
}
