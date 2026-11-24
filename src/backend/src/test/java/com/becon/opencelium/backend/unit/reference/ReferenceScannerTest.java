package com.becon.opencelium.backend.unit.reference;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.reference.ReferenceScanner;
import com.becon.opencelium.backend.reference.ReferenceScanner.BoundScript;
import com.becon.opencelium.backend.reference.ReferenceScanner.ScriptRef;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for how {@link ReferenceScanner} extracts a global variable reference next to the
 * other reference types.
 *
 * <p>Run with: ./gradlew test --tests "*.ReferenceScannerTest"
 */
@DisplayName("ReferenceScanner — unit")
class ReferenceScannerTest {

    @Test
    @DisplayName("extract — a global variable is one reference, not request data inside braces")
    void extractReturnsGlobalReferenceWholeWhenTextHoldsOne() {
        List<String> references = ReferenceScanner.extract("{{global.idoitUrl}}/api/{tenant}");

        assertThat(references).containsExactly("{{global.idoitUrl}}", "{tenant}");
    }

    @Test
    @DisplayName("extract — an escaped token is literal text: no reference is found in it")
    void extractReturnsNothingWhenGlobalTokenIsEscaped() {
        List<String> references = ReferenceScanner.extract("\\{{global.idoitUrl}}");

        assertThat(references).isEmpty();
    }

    @Test
    void extractKeepsWrappedDirectReferenceWhenGlobalStandsNextToIt() {
        List<String> references =
                ReferenceScanner.extract("{{global.prefix}}{%#ababab.(response).body.$.id%}");

        assertThat(references)
                .containsExactly("{{global.prefix}}", "{%#ababab.(response).body.$.id%}");
    }

    // ── ref("...") in script code ─────────────────────────────────────────────

    @Test
    void findScriptRefsReturnsReferenceWhenCodeCallsRef() {
        String code = "var tenants = ref(\"{{global.tenants}}\");";

        List<ScriptRef> refs = ReferenceScanner.findScriptRefs(code);

        assertThat(refs).containsExactly(new ScriptRef(14, 39, "{{global.tenants}}"));
        assertThat(code.substring(14, 39)).isEqualTo("ref(\"{{global.tenants}}\")");
    }

    @Test
    void findScriptRefsAcceptsSingleQuotesAndSpacesWhenCallIsWrittenSo() {
        List<ScriptRef> refs = ReferenceScanner.findScriptRefs("ref ( '{{global.limits.max}}' ) + 1");

        assertThat(refs).extracting(ScriptRef::reference).containsExactly("{{global.limits.max}}");
    }

    @Test
    @DisplayName("findScriptRefs — obj.ref(...) and myref(...) are other functions, not ref()")
    void findScriptRefsSkipsCallWhenRefIsPartOfLongerName() {
        List<ScriptRef> refs = ReferenceScanner.findScriptRefs(
                "obj.ref(\"{{global.a}}\"); myref(\"{{global.b}}\"); $ref(\"{{global.c}}\");");

        assertThat(refs).isEmpty();
    }

    @Test
    void findScriptRefsSkipsCallWhenArgumentHoldsNoReference() {
        assertThat(ReferenceScanner.findScriptRefs("ref(\"plain text\")")).isEmpty();
    }

    @Test
    @DisplayName("bindScriptRefs — each call becomes a variable bound to its reference; a repeated reference shares one")
    void bindScriptRefsReplacesCallsWithBoundVariablesWhenCodeCallsRef() {
        String code = "var a = ref(\"{{global.a}}\"); var b = ref('{{global.b.x}}'); var c = ref(\"{{global.a}}\");";

        BoundScript bound = ReferenceScanner.bindScriptRefs(code, Map.of("VAR_0", "#ababab.(response).body.$.id"));

        assertThat(bound.code()).isEqualTo("var a = OC_REF_0; var b = OC_REF_1; var c = OC_REF_0;");
        assertThat(bound.args()).containsExactlyInAnyOrderEntriesOf(Map.of(
                "VAR_0", "#ababab.(response).body.$.id",
                "OC_REF_0", "{{global.a}}",
                "OC_REF_1", "{{global.b.x}}"));
    }

    @Test
    void bindScriptRefsSkipsNameWhenArgAlreadyUsesIt() {
        BoundScript bound = ReferenceScanner.bindScriptRefs("ref(\"{{global.a}}\")", Map.of("OC_REF_0", "{x}"));

        assertThat(bound.code()).isEqualTo("OC_REF_1");
        assertThat(bound.args()).containsEntry("OC_REF_0", "{x}").containsEntry("OC_REF_1", "{{global.a}}");
    }

    @Test
    void bindScriptRefsReturnsCodeAndArgsUnchangedWhenCodeHasNoRef() {
        BoundScript bound = ReferenceScanner.bindScriptRefs("RESULT_VAR = VAR_0 + 1;", Map.of("VAR_0", "{x}"));

        assertThat(bound.code()).isEqualTo("RESULT_VAR = VAR_0 + 1;");
        assertThat(bound.args()).containsExactly(Map.entry("VAR_0", "{x}"));
    }

    @Test
    void bindScriptRefsReturnsEmptyArgsWhenCodeAndArgsAreNull() {
        BoundScript bound = ReferenceScanner.bindScriptRefs(null, null);

        assertThat(bound.code()).isNull();
        assertThat(bound.args()).isEmpty();
    }

    // ── set("...", value) in script code ──────────────────────────────────────

    @Test
    void findScriptSetsReturnsQuotedTargetWhenCodeCallsSet() {
        String code = "set(\"{{global.lastSync}}\", VAR_0); set ( '{{global.page}}' , 2);";

        List<ScriptRef> sets = ReferenceScanner.findScriptSets(code);

        assertThat(sets).extracting(ScriptRef::reference).containsExactly("{{global.lastSync}}", "{{global.page}}");
        assertThat(code.substring(sets.get(0).start(), sets.get(0).end())).isEqualTo("\"{{global.lastSync}}\"");
    }

    @Test
    void findScriptSetsSkipsCallWhenSetIsPartOfLongerName() {
        assertThat(ReferenceScanner.findScriptSets("map.set('{{global.a}}', 1); reset('{{global.b}}', 2);")).isEmpty();
    }

    @Test
    @DisplayName("callsScriptSet — any set(...) call counts, even one whose target is not quoted")
    void callsScriptSetReturnsTrueWhenTargetIsNotQuoted() {
        assertThat(ReferenceScanner.callsScriptSet("var t = '{{global.a}}'; set(t, 1);")).isTrue();
        assertThat(ReferenceScanner.callsScriptSet("map.set('a', 1); RESULT_VAR = 1;")).isFalse();
        assertThat(ReferenceScanner.callsScriptSet(null)).isFalse();
    }
}
