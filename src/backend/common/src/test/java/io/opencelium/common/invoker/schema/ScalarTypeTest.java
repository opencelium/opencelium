package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScalarTypeTest {

    @Test
    void fromValueIgnoresCaseAndSurroundingWhitespace() {
        assertThat(ScalarType.fromValue(" Integer ")).isEqualTo(ScalarType.INTEGER);
    }

    @Test
    void fromValueThrowsWhenNameIsNotAScalarType() {
        assertThatThrownBy(() -> ScalarType.fromValue("date"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'date' is not a scalar type; expected string, number, integer or boolean");
    }
}
