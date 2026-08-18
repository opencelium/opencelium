package com.becon.opencelium.backend.unit.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.operator.operators.OperatorFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the {@code MatchesInList} (AllowList) operator.
 *
 * No Spring context is loaded — the operator is obtained from
 * {@link OperatorFactory} and exercised through the public {@link Operator} API.
 */
@DisplayName("MatchesInList (AllowList) — unit")
class MatchesInListTest {

    private static final Operator matchesInList = OperatorFactory.getOperator(OperatorEnum.MATCHES_IN_LIST);

    @Test
    void applyReturnsExpectedResultWhenRightOperandIsRealList() throws ApplyOperatorException {
        assertThat(matchesInList.apply("hello", List.of("world", "hel%"))).isEqualTo(true);
        assertThat(matchesInList.apply("hello", List.of("world", "foo"))).isEqualTo(false);
    }

    @Test
    void applyReturnsExpectedResultWhenRightOperandIsCommaOrNewlineSeparatedString() throws ApplyOperatorException {
        assertThat(matchesInList.apply("hello", "world,hel%")).isEqualTo(true);
        assertThat(matchesInList.apply("hello", "world\nhel%")).isEqualTo(true);
        assertThat(matchesInList.apply("hello", "world,foo")).isEqualTo(false);
    }

    @Test
    @DisplayName("string-encoded array behaves like a real list")
    void applyReturnsSameResultWhenRightOperandIsStringEncodedArray() throws ApplyOperatorException {
        assertThat(matchesInList.apply("hello", "[world, hel%]")).isEqualTo(true);
        assertThat(matchesInList.apply("hello", "[world, hel%]"))
                .isEqualTo(matchesInList.apply("hello", List.of("world", "hel%")));
    }

    @Test
    void applyReturnsTrueWhenNumberLeftOperandIsCoerced() throws ApplyOperatorException {
        assertThat(matchesInList.apply(123, List.of("12%", "foo"))).isEqualTo(true);
    }

    @Test
    void applyReturnsTrueWhenNonStringListElementsAreCoerced() throws ApplyOperatorException {
        assertThat(matchesInList.apply("12", List.of(12, 34))).isEqualTo(true);
    }

    @Test
    void applyReturnsFalseWhenLeftOperandIsNull() throws ApplyOperatorException {
        assertThat(matchesInList.apply(null, List.of("hel%"))).isEqualTo(false);
        assertThat(matchesInList.apply(null, "hel%")).isEqualTo(false);
    }

    @Test
    void isValidOperandReturnsExpectedResultWhenSideAndTypeVary() {
        assertThat(matchesInList.isValidOperand(SidesType.LEFT, null)).isTrue();
        assertThat(matchesInList.isValidOperand(SidesType.RIGHT, "x")).isTrue();
        assertThat(matchesInList.isValidOperand(SidesType.RIGHT, List.of("x"))).isTrue();
    }
}
