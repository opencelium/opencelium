package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalTextRenderer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link GlobalTextRenderer}: rendering the text of a connector field or of a
 * notification template in one pass.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalTextRendererTest"
 */
@DisplayName("GlobalTextRenderer — unit")
class GlobalTextRendererTest {

    @Test
    void renderReplacesEveryReferenceWhenTextHoldsSeveral() {
        Map<String, String> values = Map.of(
                "{{global.idoitUrl}}", "https://cmdb.example.test",
                "{{global.tenants[0].id}}", "acme");

        String rendered = GlobalTextRenderer.render(
                "{{global.idoitUrl}}/tenants/{{global.tenants[0].id}}?from={{global.idoitUrl}}",
                reference -> values.get(reference.getRaw()));

        assertThat(rendered).isEqualTo("https://cmdb.example.test/tenants/acme?from=https://cmdb.example.test");
    }

    @Test
    @DisplayName("render — an escaped token is literal text: no value is asked for it")
    void renderRemovesBackslashWhenTokenIsEscaped() {
        List<String> asked = new ArrayList<>();

        String rendered = GlobalTextRenderer.render("Send \\{{global.apiKey}} as it is", reference -> {
            asked.add(reference.getRaw());
            return "k3y";
        });

        assertThat(rendered).isEqualTo("Send {{global.apiKey}} as it is");
        assertThat(asked).isEmpty();
    }

    @Test
    @DisplayName("render — a value is data: a reference written in it is not resolved again")
    void renderKeepsInsertedValueLiteralWhenItHoldsReference() {
        Map<String, String> values = Map.of(
                "{{global.template}}", "{{global.apiKey}}",
                "{{global.apiKey}}", "k3y");

        String rendered = GlobalTextRenderer.render(
                "{{global.template}} {{global.apiKey}}", reference -> values.get(reference.getRaw()));

        assertThat(rendered).isEqualTo("{{global.apiKey}} k3y");
    }

    @Test
    void renderReturnsSameTextWhenItHoldsNoToken() {
        String text = "Bearer {token} for ${tenant}";

        String rendered = GlobalTextRenderer.render(text, reference -> "never used");

        assertThat(rendered).isEqualTo(text);
    }

    @Test
    void renderPropagatesExceptionWhenValueCannotBeResolved() {
        assertThatThrownBy(() -> GlobalTextRenderer.render("key={{global.apiKey}}", reference -> {
            throw new GlobalVariableNotFoundException(reference.getName());
        }))
                .isInstanceOf(GlobalVariableNotFoundException.class)
                .hasMessageContaining("'apiKey'");
    }
}
