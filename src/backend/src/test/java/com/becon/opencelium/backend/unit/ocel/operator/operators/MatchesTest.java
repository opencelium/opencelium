package com.becon.opencelium.backend.unit.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.operator.operators.OperatorFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the {@code Matches} operator.
 *
 * No Spring context is loaded — the operator is obtained from
 * {@link OperatorFactory} and exercised through the public {@link Operator} API.
 */
@DisplayName("Matches — unit")
class MatchesTest {

    private static final Operator matches = OperatorFactory.getOperator(OperatorEnum.MATCHES);

    @Test
    void applyReturnsExpectedResultWhenValueIsMatchedAgainstRegex() throws ApplyOperatorException {
        assertThat(matches.apply("hello123", "[a-z]+\\d+")).isEqualTo(true);
        assertThat(matches.apply("abc", "\\d+")).isEqualTo(false);
    }

    @Test
    void applyReturnsExpectedResultWhenNumberOperandsAreCoerced() throws ApplyOperatorException {
        assertThat(matches.apply(123, "\\d+")).isEqualTo(true);
        assertThat(matches.apply(123, "\\d{2}")).isEqualTo(false);
    }

    @Test
    void applyThrowsApplyOperatorExceptionWhenRegexIsInvalid() {
        assertThatThrownBy(() -> matches.apply("abc", "["))
                .isInstanceOf(ApplyOperatorException.class);
    }

    @Test
    void applyThrowsWhenOperandIsNull() {
        assertThatThrownBy(() -> matches.apply(null, "\\d+"))
                .isInstanceOf(ApplyOperatorException.class);
    }

    @Test
    void isValidOperandReturnsExpectedResultWhenOperandIsPrimitiveOrNull() {
        assertThat(matches.isValidOperand(SidesType.LEFT, 1)).isTrue();
        assertThat(matches.isValidOperand(SidesType.RIGHT, "x")).isTrue();
        assertThat(matches.isValidOperand(SidesType.LEFT, null)).isFalse();
        assertThat(matches.isValidType(SidesType.LEFT, Number.class)).isTrue();
    }
}
