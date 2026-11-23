package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.awaitility.Awaitility.await;

import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript.Parameter;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript.SyntaxError;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.time.Duration;
import java.util.HashMap;
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
 * Unit tests for {@link GlobalScript}: what saving a script variable checks, and the JSON form it
 * is stored in.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalScriptTest"
 */
@DisplayName("GlobalScript — unit")
class GlobalScriptTest {

    private static final Parameter DATE = new Parameter("date", "ISO date text", true, null);
    private static final Parameter PATTERN = new Parameter("pattern", null, false, TextNode.valueOf("dd.MM.yyyy"));

    @Test
    void checkReturnsNoViolationWhenScriptIsValid() {
        GlobalScript script = new GlobalScript("js", GlobalVariableFixture.FORMAT_DATE_CODE, List.of(DATE, PATTERN));

        assertThat(script.check()).isEmpty();
    }

    @Test
    void checkReturnsNoViolationWhenScriptHasNoParameters() {
        assertThat(aScript("return 42;").check()).isEmpty();
    }

    @Test
    @DisplayName("check — a syntax error names its line in the code, not in the function around it")
    void checkReportsLineOfCodeWhenCodeDoesNotParse() {
        List<Violation> violations = aScript("var a = 1;\nvar b = ;\nreturn a;").check();

        assertThat(violations).extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.code", Code.SCRIPT_SYNTAX));
        assertThat(violations.get(0).message()).startsWith("Line 2,").doesNotContain("OC_SCRIPT");
    }

    @Test
    @DisplayName("check — code that closes its function early is refused, though it parses")
    void checkReportsSyntaxWhenCodeClosesFunctionEarly() {
        assertThat(aScript("return 1; } other(); function x() {").check())
                .extracting(Violation::code)
                .containsExactly(Code.SCRIPT_SYNTAX);
    }

    @ParameterizedTest
    @ValueSource(strings = {"var a = 1;", "return;", "function inner() { return 1; }\ninner();",
            "var f = function () { return 1; };"})
    void checkReportsNoReturnValueWhenFunctionItselfReturnsNothing(String code) {
        assertThat(aScript(code).check())
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.code", Code.NO_RETURN_VALUE));
    }

    @Test
    void checkAcceptsReturnWhenItIsInsideBranch() {
        GlobalScript script = new GlobalScript("js", "if (date) { return 1; }\nreturn 2;", List.of(DATE));

        assertThat(script.check()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"return ref('{{global.limit}}');", "set('{{global.lastSync}}', 1); return 1;",
            "function f() { return ref('{{global.limit}}'); }\nreturn f();"})
    @DisplayName("check — a script uses only its parameters, so ref() and set() are refused anywhere")
    void checkReportsNotPureWhenCodeCallsRefOrSet(String code) {
        assertThat(aScript(code).check())
                .extracting(Violation::code)
                .containsExactly(Code.SCRIPT_NOT_PURE);
    }

    @Test
    void checkAcceptsCallWhenRefIsMethodOfObject() {
        GlobalScript script = new GlobalScript("js", "return date.ref(1);", List.of(DATE));

        assertThat(script.check()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"1st", "has-dash", "default", "arguments", ""})
    void checkReportsParameterInvalidWhenNameIsNoUsableIdentifier(String name) {
        GlobalScript script = new GlobalScript("js", "return 1;", List.of(DATE, new Parameter(name, null, true, null)));

        assertThat(script.check())
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.parameters[1].name", Code.PARAMETER_INVALID));
    }

    @Test
    void checkReportsParameterInvalidWhenNameIsDeclaredTwice() {
        GlobalScript script = new GlobalScript("js", "return 1;", List.of(DATE, DATE));

        assertThat(script.check())
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.parameters[1].name", Code.PARAMETER_INVALID));
    }

    @ParameterizedTest
    @ValueSource(strings = {"python2", "ruby", "JS", "Python3"})
    void checkReportsLanguageNotSupportedWhenLanguageIsNeitherJsNorPython3(String language) {
        assertThat(new GlobalScript(language, "return 1;", List.of()).check())
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.language", Code.LANGUAGE_NOT_SUPPORTED));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "  \n"})
    void checkReportsScriptRequiredWhenCodeIsBlank(String code) {
        assertThat(aScript(code).check())
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.code", Code.SCRIPT_REQUIRED));
    }

    // ── Python ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("check — Python code is not parsed here, and code without return is accepted: it returns None")
    void checkReturnsNoViolationWhenPythonCodeHasNoReturn() {
        GlobalScript script = new GlobalScript("python3", "x = date\nif x:\n    return x", List.of(DATE, PATTERN));

        assertThat(script.check()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"$date", "lambda", "None", "extra"})
    void checkReportsParameterInvalidWhenNameIsNoUsablePythonIdentifier(String name) {
        GlobalScript script = new GlobalScript("python3", "return 1", List.of(new Parameter(name, null, true, null)));

        assertThat(script.check()).extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.parameters[0].name", Code.PARAMETER_INVALID));
    }

    @Test
    void checkAcceptsJavaScriptKeywordWhenItNamesPythonParameter() {
        GlobalScript script = new GlobalScript("python3", "return function",
                List.of(new Parameter("function", null, true, null)));

        assertThat(script.check()).isEmpty();
    }

    @Test
    @DisplayName("functionSource — a Python script becomes OC_SCRIPT(<parameters>, *extra), built by ast")
    void functionSourceDefinesPythonFunctionWhenScriptIsPython() {
        GlobalScript script = new GlobalScript("python3", "return date[:5]", List.of(DATE, PATTERN));

        String source = script.functionSource("VAR_1", "formatDate");

        assertThat(source)
                .startsWith("def _oc_import_VAR_1():\n")
                .contains("tree = ast.parse(\"return date[:5]\", \"<script variable formatDate>\", 'exec')")
                .contains("ast.parse(\"def OC_SCRIPT(date, pattern, *extra): pass\")")
                .contains("raise Exception(\"Script variable 'formatDate'\" + \": parameter 'date' is missing\")")
                .contains("args.append(json.loads(\"\\\"dd.MM.yyyy\\\"\"))")
                .endsWith("VAR_1 = _oc_import_VAR_1()\ndel _oc_import_VAR_1\n");
    }

    @Test
    void functionSourceTakesOnlyExtraArgumentsWhenPythonScriptHasNoParameters() {
        assertThat(new GlobalScript("python3", "return len(extra)", List.of()).functionSource("VAR_1", "count"))
                .contains("ast.parse(\"def OC_SCRIPT(*extra): pass\")")
                .doesNotContain("len(args) <=");
    }

    @Test
    void functionSourceThrowsWhenVariableIsPythonKeyword() {
        GlobalScript script = new GlobalScript("python3", "return 1", List.of());

        assertThatThrownBy(() -> script.functionSource("None", "answer")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void pythonCheckSourceReadsCodeFromBindingWhenBuildingFunction() {
        String source = new GlobalScript("python3", "return 1", List.of(DATE)).pythonCheckSource();

        assertThat(source)
                .contains("tree = ast.parse(" + GlobalScript.PYTHON_CHECK_CODE + ", ")
                .contains("ast.parse(\"def OC_SCRIPT(date, *extra): pass\")")
                .doesNotContain("return 1")
                .endsWith("RESULT_VAR = _oc_check()\nRESULT_VAR\n");
    }

    @Test
    void pythonCheckResultReturnsNothingWhenCodeIsAccepted() {
        assertThat(GlobalScript.pythonCheckResult(Map.of("ok", true))).isEmpty();
    }

    @Test
    @DisplayName("pythonCheckResult — the service gives numbers as doubles, the position is read as whole numbers")
    void pythonCheckResultReturnsPositionWhenCodeDoesNotParse() {
        Map<String, Object> answer = Map.of("ok", false, "line", 2.0, "column", 11.0, "message", "invalid syntax");

        assertThat(GlobalScript.pythonCheckResult(answer)).contains(new SyntaxError(2L, 11L, "invalid syntax"));
    }

    @Test
    void pythonCheckResultReturnsMessageOnlyWhenErrorHasNoPosition() {
        Map<String, Object> answer = new HashMap<>(Map.of("ok", false, "message", "uses 'yield'"));
        answer.put("line", null);

        assertThat(GlobalScript.pythonCheckResult(answer)).map(SyntaxError::describe).contains("uses 'yield'");
    }

    @ParameterizedTest
    @MethodSource("unreadableCheckAnswers")
    void pythonCheckResultThrowsIllegalStateExceptionWhenAnswerIsNotTheCheck(Object answer) {
        assertThatThrownBy(() -> GlobalScript.pythonCheckResult(answer)).isInstanceOf(IllegalStateException.class);
    }

    static Stream<Arguments> unreadableCheckAnswers() {
        return Stream.of(Arguments.of((Object) null), Arguments.of("ok"), Arguments.of(Map.of("ok", "yes")));
    }

    @Test
    void describeLeavesColumnOutWhenOnlyLineIsKnown() {
        assertThat(new SyntaxError(3L, null, "unexpected indent").describe()).isEqualTo("Line 3: unexpected indent");
    }

    // ── the function an enhancement calls ─────────────────────────────────────

    private static final GlobalScript FORMAT_DATE =
            new GlobalScript("js", GlobalVariableFixture.FORMAT_DATE_CODE, List.of(DATE, PATTERN));

    @Test
    void functionSourceReturnsResultWhenCallPassesEveryParameter() {
        assertThat(call(FORMAT_DATE, "VAR_1('2026-11-17T22:00:00Z', 'dd.MM')")).isEqualTo("17.11");
    }

    @Test
    @DisplayName("functionSource — a parameter left out, or passed as undefined, takes its default")
    void functionSourceFillsDefaultWhenOptionalParameterIsLeftOut() {
        assertThat(call(FORMAT_DATE, "VAR_1('2026-11-17T22:00:00Z')")).isEqualTo("17.11.2026");
        assertThat(call(FORMAT_DATE, "VAR_1('2026-11-17T22:00:00Z', undefined)")).isEqualTo("17.11.2026");
    }

    @Test
    void functionSourceThrowsWhenRequiredParameterIsLeftOut() {
        assertThatThrownBy(() -> call(FORMAT_DATE, "VAR_1()"))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("Script variable 'formatDate': parameter 'date' is missing");
    }

    @Test
    void functionSourcePassesExtraArgumentsWhenCallHasMoreThanDeclared() {
        GlobalScript count = new GlobalScript("js", "return arguments.length;", List.of());

        assertThat(call(count, "VAR_1(1, 2, 3)")).isEqualTo(3);
    }

    @Test
    void functionSourceNamesScriptWhenCodeThrows() {
        GlobalScript failing = new GlobalScript("js", "throw new Error('boom'); return 1;", List.of());

        assertThatThrownBy(() -> call(failing, "VAR_1()"))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("Script variable 'formatDate': Error: boom");
    }

    @Test
    void functionSourceThrowsWhenCodeReturnsUndefined() {
        GlobalScript nothing = new GlobalScript("js", "return undefined;", List.of());

        assertThatThrownBy(() -> call(nothing, "VAR_1()"))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessageContaining("Script variable 'formatDate' returned nothing");
    }

    @Test
    @DisplayName("functionSource — a default object is new on every call, so a call cannot change the next one's")
    void functionSourceGivesFreshDefaultWhenCallChangesIt() {
        GlobalScript push = new GlobalScript("js", "list.push(1); return list.length;",
                List.of(new Parameter("list", null, false, new ObjectMapper().createArrayNode())));

        assertThat(call(push, "VAR_1() + ',' + VAR_1()")).isEqualTo("1,1");
    }

    @ParameterizedTest
    @ValueSource(strings = {"1st", "VAR 1", "default"})
    void functionSourceThrowsWhenVariableIsNoIdentifier(String variable) {
        assertThatThrownBy(() -> FORMAT_DATE.functionSource(variable, "formatDate"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /** Defines the script as {@code VAR_1} the way an enhancement imports it, then runs {@code call}. */
    private static Object call(GlobalScript script, String call) {
        return new NashornEngine().execute(script.functionSource("VAR_1", "formatDate") + call, Map.of());
    }

    // ── time limit ────────────────────────────────────────────────────────────

    @Test
    void runWithinReturnsResultWhenWorkEndsInTime() {
        assertThat(GlobalScript.runWithin(Duration.ofSeconds(5), "work", () -> 42)).isEqualTo(42);
    }

    @Test
    void runWithinRethrowsExceptionWhenWorkFails() {
        assertThatThrownBy(() -> GlobalScript.runWithin(Duration.ofSeconds(5), "work", () -> {
            throw new IllegalStateException("broken");
        })).isInstanceOf(IllegalStateException.class).hasMessage("broken");
    }

    @Test
    @DisplayName("runWithin — a script that loops forever is stopped, and its thread ends")
    void runWithinStopsWorkWhenLimitPasses() {
        assertThatThrownBy(() -> GlobalScript.runWithin(Duration.ofMillis(300), "The enhancement",
                () -> new NashornEngine().execute("while (true) {}", Map.of())))
                .isInstanceOf(ScriptExecutionException.class)
                .hasMessage("The enhancement ran longer than 300 ms and was stopped");

        await().atMost(Duration.ofSeconds(5)).until(() -> Thread.getAllStackTraces().keySet().stream()
                .noneMatch(thread -> thread.getName().equals("oc-global-script") && thread.isAlive()));
    }

    // ── parameter changes ─────────────────────────────────────────────────────

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("breakingChanges")
    @DisplayName("breakingChangeTo — a change that a positional call no longer fits is named")
    void breakingChangeToReturnsChangeWhenCallsNoLongerFit(String reason, List<Parameter> parameters,
            String parameter, String change) {
        GlobalScript saved = aScriptWith(DATE, PATTERN);

        assertThat(saved.breakingChangeTo(new GlobalScript("js", "return 1;", parameters)))
                .contains(new GlobalScript.BreakingChange(parameter, change));
    }

    static Stream<Arguments> breakingChanges() {
        Parameter locale = new Parameter("locale", null, true, null);
        return Stream.of(
                Arguments.of("removed", List.of(DATE), "pattern", "parameter 'pattern' is removed"),
                Arguments.of("reordered", List.of(PATTERN, DATE), "date", "parameter 'date' is no longer parameter 1"),
                Arguments.of("renamed", List.of(DATE, new Parameter("format", null, false, TextNode.valueOf("dd"))),
                        "pattern", "parameter 'pattern' is no longer parameter 2"),
                Arguments.of("made required", List.of(DATE, new Parameter("pattern", null, true, null)),
                        "pattern", "parameter 'pattern' becomes required"),
                Arguments.of("required one added", List.of(DATE, PATTERN, locale),
                        "locale", "new parameter 'locale' has no default"));
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("fittingChanges")
    void breakingChangeToReturnsNothingWhenCallsStillFit(String reason, List<Parameter> parameters) {
        GlobalScript saved = aScriptWith(DATE, PATTERN);

        assertThat(saved.breakingChangeTo(new GlobalScript("js", "return 1;", parameters))).isEmpty();
    }

    static Stream<Arguments> fittingChanges() {
        return Stream.of(
                Arguments.of("the same parameters", List.of(DATE, PATTERN)),
                Arguments.of("an optional one added", List.of(DATE, PATTERN, new Parameter("locale", null, false, null))),
                Arguments.of("a required one made optional",
                        List.of(new Parameter("date", null, false, TextNode.valueOf("now")), PATTERN)),
                Arguments.of("a new default", List.of(DATE, new Parameter("pattern", null, false, TextNode.valueOf("dd")))));
    }

    @Test
    @DisplayName("changesSignature — a new description is no change a call could notice")
    void changesSignatureReturnsFalseWhenOnlyDescriptionChanges() {
        GlobalScript saved = aScriptWith(DATE, PATTERN);
        Parameter described = new Parameter("pattern", "Output pattern", false, TextNode.valueOf("dd.MM.yyyy"));

        assertThat(saved.changesSignature(aScriptWith(DATE, described))).isFalse();
    }

    @Test
    void changesSignatureReturnsTrueWhenDefaultChanges() {
        GlobalScript saved = aScriptWith(DATE, PATTERN);

        assertThat(saved.changesSignature(
                aScriptWith(DATE, new Parameter("pattern", null, false, TextNode.valueOf("dd"))))).isTrue();
    }

    // ── JSON form ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toJson/fromJson — the definition survives the value column, default and all")
    void fromJsonReturnsEqualScriptWhenReadingWhatToJsonWrote() {
        GlobalScript script = new GlobalScript("js", GlobalVariableFixture.FORMAT_DATE_CODE, List.of(DATE, PATTERN));

        String json = script.toJson();

        assertThat(json).contains("\"default\":\"dd.MM.yyyy\"");
        assertThat(GlobalScript.fromJson(json)).isEqualTo(script);
    }

    @Test
    void fromJsonThrowsIllegalStateExceptionWhenTextIsNoDefinition() {
        assertThatThrownBy(() -> GlobalScript.fromJson("\"https://cmdb.example\""))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Parameter — a required one has no default, an optional one without a default gets null")
    void parameterNormalizesDefaultWhenRequiredDecides() {
        assertThat(new Parameter("a", null, true, TextNode.valueOf("x")).defaultValue()).isNull();
        assertThat(new Parameter("a", null, false, null).defaultValue()).isEqualTo(NullNode.getInstance());
    }

    private static GlobalScript aScript(String code) {
        return new GlobalScript("js", code, List.of());
    }

    private static GlobalScript aScriptWith(Parameter... parameters) {
        return new GlobalScript("js", GlobalVariableFixture.FORMAT_DATE_CODE, List.of(parameters));
    }
}
