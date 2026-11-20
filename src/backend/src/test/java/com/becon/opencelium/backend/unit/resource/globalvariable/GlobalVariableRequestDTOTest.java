package com.becon.opencelium.backend.unit.resource.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.databind.node.TextNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link GlobalVariableRequestDTO#toString()}, through which a request body is
 * logged: a value that may be a secret must stay out of it.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableRequestDTOTest"
 */
@DisplayName("GlobalVariableRequestDTO — unit")
class GlobalVariableRequestDTOTest {

    @Test
    void toStringHidesValueWhenSecretIsTrue() {
        GlobalVariableRequestDTO request = aRequest(true);

        assertThat(request.toString()).doesNotContain("s3cr3t").contains("value=****");
    }

    @Test
    @DisplayName("toString — an update that leaves the flag out may concern a secret")
    void toStringHidesValueWhenSecretIsLeftOut() {
        GlobalVariableRequestDTO request = aRequest(null);

        assertThat(request.toString()).doesNotContain("s3cr3t").contains("value=****");
    }

    @Test
    void toStringShowsValueWhenSecretIsFalse() {
        GlobalVariableRequestDTO request = aRequest(false);

        assertThat(request.toString()).contains("value=\"s3cr3t\"").contains("name=apiKey");
    }

    private static GlobalVariableRequestDTO aRequest(Boolean secret) {
        return new GlobalVariableRequestDTO("apiKey", GlobalVariableKind.CONSTANT, null, new TextNode("s3cr3t"),
                secret, GlobalVariableFixture.aScopeOfAll(), null, null, 3L);
    }
}
