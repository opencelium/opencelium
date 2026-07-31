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
 * Unit tests for the {@code DenyList} operator.
 *
 * No Spring context is loaded — operators are obtained from
 * {@link OperatorFactory} and exercised through the public {@link Operator} API.
 */
@DisplayName("DenyList — unit")
class DenyListTest {

    private static final Operator denyList = OperatorFactory.getOperator(OperatorEnum.DENY_LIST);
    private static final Operator matchesInList = OperatorFactory.getOperator(OperatorEnum.MATCHES_IN_LIST);

    @Test
    void applyReturnsTrueWhenNoPatternMatches() throws ApplyOperatorException {
        assertThat(denyList.apply("hello", List.of("world", "foo"))).isEqualTo(true);
    }

    @Test
    void applyReturnsFalseWhenAnyPatternMatches() throws ApplyOperatorException {
        assertThat(denyList.apply("hello", List.of("world", "hel%"))).isEqualTo(false);
    }

    @Test
    @DisplayName("string-encoded array behaves like a real list")
    void applyReturnsFalseWhenStringEncodedArrayMatches() throws ApplyOperatorException {
        assertThat(denyList.apply("hello", "[world, hel%]")).isEqualTo(false);
    }

    @Test
    void applyReturnsExpectedResultWhenNumberLeftOperandIsCoerced() throws ApplyOperatorException {
        assertThat(denyList.apply(123, List.of("12%"))).isEqualTo(false);
        assertThat(denyList.apply(123, List.of("99%"))).isEqualTo(true);
    }

    @Test
    void applyReturnsTrueWhenLeftOperandIsNull() throws ApplyOperatorException {
        assertThat(denyList.apply(null, List.of("hel%"))).isEqualTo(true);
    }

    @Test
    void applyReturnsExactNegationOfMatchesInListForIdenticalInputs() throws ApplyOperatorException {
        Object[][] inputs = {
                {"hello", List.of("world", "hel%")},
                {"hello", List.of("foo")},
                {"hello", "world,hel%"},
                {123, List.of("12%")},
        };
        for (Object[] in : inputs) {
            boolean allow = (Boolean) matchesInList.apply(in[0], in[1]);
            boolean deny = (Boolean) denyList.apply(in[0], in[1]);
            assertThat(deny).isEqualTo(!allow);
        }
    }

    @Test
    void isValidOperandDelegatesToMatchesInList() {
        assertThat(denyList.isValidOperand(SidesType.LEFT, null)).isTrue();
        assertThat(denyList.isValidOperand(SidesType.RIGHT, "x")).isTrue();
        assertThat(denyList.isValidOperand(SidesType.RIGHT, List.of("x"))).isTrue();
    }
}
