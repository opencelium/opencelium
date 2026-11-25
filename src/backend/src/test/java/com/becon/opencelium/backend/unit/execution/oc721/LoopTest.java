package com.becon.opencelium.backend.unit.execution.oc721;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.oc721.Loop;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Unit tests for how {@link Loop#fromExpression(String)} takes a global variable as the source
 * of a loop.
 *
 * <p>Run with: ./gradlew test --tests "*.LoopTest"
 */
@DisplayName("Loop — unit")
class LoopTest {

    @Test
    void fromExpressionUsesGlobalAsSourceWhenForHasNoMethodReference() {
        Loop loop = Loop.fromExpression("for {{global.tenants}}");

        assertThat(loop.getOperator()).isEqualTo(RelationalOperator.FOR);
        assertThat(loop.getRef()).isEqualTo("{{global.tenants}}");
    }

    @Test
    @DisplayName("fromExpression — forin reads keys from the value itself: no ['*']~ is appended to a global")
    void fromExpressionUsesGlobalAsSourceWhenForInHasNoMethodReference() {
        Loop loop = Loop.fromExpression("forin {{global.regions}}");

        assertThat(loop.getOperator()).isEqualTo(RelationalOperator.FOR_IN);
        assertThat(loop.getRef()).isEqualTo("{{global.regions}}");
    }

    @Test
    void fromExpressionReadsDelimiterWhenSplitStringUsesGlobal() {
        Loop loop = Loop.fromExpression("{{global.csv}} SplitString ','");

        assertThat(loop.getOperator()).isEqualTo(RelationalOperator.SPLIT_STRING);
        assertThat(loop.getRef()).isEqualTo("{{global.csv}}");
        assertThat(loop.getDelimiter()).isEqualTo(",");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("expressionsWithMethodAndGlobalReference")
    @DisplayName("fromExpression — a global is the source only when no method reference is")
    void fromExpressionPrefersMethodReferenceWhenBothArePresent(String expression, String expectedRef) {
        Loop loop = Loop.fromExpression(expression);

        assertThat(loop.getRef()).isEqualTo(expectedRef);
    }

    static Stream<Arguments> expressionsWithMethodAndGlobalReference() {
        return Stream.of(
                Arguments.of(
                        "for {%#ababab.(response).body.$.items[*]%} {{global.tenants}}",
                        "{%#ababab.(response).body.$.items[*]%}"),
                Arguments.of(
                        "forin {%#ababab.(response).body.$.meta%} {{global.regions}}",
                        "#ababab.(response).body.$.meta['*']~"),
                Arguments.of(
                        "{%#ababab.(response).body.$.csv[*]~%} SplitString '{{global.delimiter}}'",
                        "{%#ababab.(response).body.$.csv[*]~%}"));
    }
}
