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
 * Unit tests for the {@code RegEx} operator.
 *
 * No Spring context is loaded — the operator is obtained from
 * {@link OperatorFactory} and exercised through the public {@link Operator} API.
 */
@DisplayName("RegEx — unit")
class RegExTest {

    private static final Operator regEx = OperatorFactory.getOperator(OperatorEnum.REGEX);

    @Test
    void applyReturnsExpectedResultWhenInputIsMatchedAgainstRegex() throws ApplyOperatorException {
        assertThat(regEx.apply("hello123", "[a-z]+\\d+")).isEqualTo(true);
        assertThat(regEx.apply("abc", "\\d+")).isEqualTo(false);
    }

    @Test
    void applyReturnsTrueWhenNumberOperandIsCoerced() throws ApplyOperatorException {
        assertThat(regEx.apply(123, "\\d+")).isEqualTo(true);
    }

    @Test
    void applyThrowsApplyOperatorExceptionWhenRegexIsInvalid() {
        assertThatThrownBy(() -> regEx.apply("abc", "("))
                .isInstanceOf(ApplyOperatorException.class);
    }

    @Test
    void applyThrowsWhenOperandIsNull() {
        assertThatThrownBy(() -> regEx.apply(null, "\\d+"))
                .isInstanceOf(ApplyOperatorException.class);
    }

    @Test
    void isValidOperandReturnsExpectedResultWhenOperandIsPrimitiveOrNull() {
        assertThat(regEx.isValidOperand(SidesType.LEFT, 1)).isTrue();
        assertThat(regEx.isValidOperand(SidesType.LEFT, null)).isFalse();
        assertThat(regEx.isValidType(SidesType.RIGHT, Boolean.class)).isTrue();
    }
}
