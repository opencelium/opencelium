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
 * Unit tests for the {@code Like} and {@code NotLike} operators.
 *
 * No Spring context is loaded — operators are obtained directly from
 * {@link OperatorFactory} and exercised through the public {@link Operator} API.
 */
@DisplayName("Like / NotLike — unit")
class LikeTest {

    private static final Operator like = OperatorFactory.getOperator(OperatorEnum.LIKE);
    private static final Operator notLike = OperatorFactory.getOperator(OperatorEnum.NOT_LIKE);

    @Test
    void applyReturnsExpectedResultWhenPatternUsesPercentWildcard() throws ApplyOperatorException {
        assertThat(like.apply("hello", "hel%")).isEqualTo(true);
        assertThat(like.apply("hello", "%llo")).isEqualTo(true);
        assertThat(like.apply("hello", "world")).isEqualTo(false);
    }

    @Test
    void applyReturnsExpectedResultWhenPatternUsesUnderscoreWildcard() throws ApplyOperatorException {
        assertThat(like.apply("hello", "h_llo")).isEqualTo(true);
        assertThat(like.apply("hello", "h_lo")).isEqualTo(false);
    }

    @Test
    void applyReturnsTrueWhenMatchIsCaseInsensitive() throws ApplyOperatorException {
        assertThat(like.apply("Hello", "hel%")).isEqualTo(true);
    }

    @Test
    void applyReturnsExpectedResultWhenNumberOperandsAreCoerced() throws ApplyOperatorException {
        assertThat(like.apply(123, "12%")).isEqualTo(true);
        assertThat(like.apply(123, 123)).isEqualTo(true);
        assertThat(like.apply("123", 12)).isEqualTo(false);
    }

    @Test
    void applyReturnsExpectedResultWhenBooleanOperandsAreCoerced() throws ApplyOperatorException {
        assertThat(like.apply(true, "tr%")).isEqualTo(true);
        assertThat(like.apply(true, false)).isEqualTo(false);
    }

    @Test
    void applyThrowsWhenEitherOperandIsNull() {
        assertThatThrownBy(() -> like.apply(null, "x"))
                .isInstanceOf(ApplyOperatorException.class);
        assertThatThrownBy(() -> like.apply("x", null))
                .isInstanceOf(ApplyOperatorException.class);
    }

    @Test
    void isValidOperandReturnsTrueWhenOperandIsPrimitive() {
        assertThat(like.isValidOperand(SidesType.LEFT, "x")).isTrue();
        assertThat(like.isValidOperand(SidesType.RIGHT, 1)).isTrue();
        assertThat(like.isValidOperand(SidesType.LEFT, true)).isTrue();
    }

    @Test
    void isValidOperandReturnsFalseWhenOperandIsNull() {
        assertThat(like.isValidOperand(SidesType.LEFT, null)).isFalse();
    }

    @Test
    void isValidTypeReturnsTrueWhenTypeIsPrimitive() {
        assertThat(like.isValidType(SidesType.LEFT, Number.class)).isTrue();
        assertThat(like.isValidType(SidesType.RIGHT, Boolean.class)).isTrue();
    }

    @Test
    void applyReturnsNegationOfLikeWhenOperatorIsNotLike() throws ApplyOperatorException {
        assertThat(notLike.apply("hello", "hel%")).isEqualTo(false);
        assertThat(notLike.apply("hello", "world")).isEqualTo(true);
        assertThat(notLike.apply(123, "12%")).isEqualTo(false);
    }

    @Test
    void isValidOperandDelegatesToLikeWhenOperatorIsNotLike() {
        assertThat(notLike.isValidOperand(SidesType.LEFT, 1)).isTrue();
        assertThat(notLike.isValidOperand(SidesType.LEFT, null)).isFalse();
        assertThat(notLike.isValidType(SidesType.RIGHT, Number.class)).isTrue();
    }
}
