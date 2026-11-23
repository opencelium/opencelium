package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript.Parameter;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
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
    @ValueSource(strings = {"python3", "ruby", "JS"})
    void checkReportsLanguageNotSupportedWhenLanguageIsNotJs(String language) {
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
}
