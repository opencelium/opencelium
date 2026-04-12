package com.becon.opencelium.backend.unit.ocel;

import com.becon.opencelium.backend.ocel.ShallowEvaluatorType;
import com.becon.opencelium.backend.ocel.Validator;
import com.becon.opencelium.backend.ocel.exception.ErrorCode;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link Validator}.
 *
 * No Spring context is loaded. The validator is instantiated directly.
 * Run with: ./gradlew test
 */
@DisplayName("OCEL Expression Validator — unit")
class ValidatorTest {

    /** Postfix Validator*/
    private final Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.POSTFIX);

    // ── valid expressions ─────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "#{%60b8d4c8f1d4a53d3c2f84d1%} || 1 = 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}|| 1 = 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%} ||1 = 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}||1 = 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}||1= 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}||1=3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}||1=3 ",
            " #{%60b8d4c8f1d4a53d3c2f84d1%}||1=3 ",
            "#{%60b8d4c8f1d4a53d3c2f84d1%} ||1=3 ",
            "#{%60b8d4c8f1d4a53d3c2f84d1%} || 1=3 ",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}|| 1=3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}    ||    1    =    3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}   ||1   = 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}   ||   1=3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}  || 1= 3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}||  1 =3",
            "#{%60b8d4c8f1d4a53d3c2f84d1%}   ||   1   =3"
    })
    void validateDoesNotThrowWhenExpressionHasVariousSpacing(String expression) {
        assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
    }

    // ── invalid parentheses ───────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "(1 = \"asda\"))",
            "(1 = \"asda\"",
            "(1 = \"asda\")(",
            "((1 = \"asda\")",
            "1 = \"asda\")",
            "((1 = \"asda\"))((",
            ")1 = \"asda\"(",
            ")",
            "("
    })
    void validateThrowsInvalidParenthesesWhenParenthesesAreUnbalanced(String expression) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOf(InvalidExpressionException.class)
                .satisfies(e -> assertThat(((InvalidExpressionException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_PARENTHESES));
    }

    // ── invalid token ─────────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "ewfwefw = 1",
            "(1 = \"asda\") && a(3 = a)",
            "1 = \"asda\" || asda",
            "([dsa]a = \"asda\")",
            "true = a\"asda\")",
            "(1a = \"asda\")"
    })
    void validateThrowsInvalidTokenWhenExpressionContainsInvalidToken(String expression) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOf(InvalidExpressionException.class)
                .satisfies(e -> assertThat(((InvalidExpressionException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_TOKEN_FOUND));
    }

    // ── unsupported operand ───────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "\"a\" > #{%60b8d4c8f1d4a53d3c2f84d1%}",
            "(1 && #{%60b8d4c8f1d4a53d3c2f84d1%} = 4)",
            "[] <= #{%60b8d4c8f1d4a53d3c2f84d1%} || true",
            "#{%60b8d4c8f1d4a53d3c2f84d1%} > \"asda\"",
            "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf true"
    })
    void validateThrowsUnsupportedOperandWhenOperandTypeIsIncompatible(String expression) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOf(InvalidExpressionException.class)
                .satisfies(e -> assertThat(((InvalidExpressionException) e).getErrorCode())
                        .isEqualTo(ErrorCode.UNSUPPORTED_OPERAND));
    }

    // ── invalid operand pairs ─────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "(1 && 6 = 4)",
            "[] = [] || 1",
            "[] IsTypeOf true"
    })
    void validateThrowsInvalidOperandPairsWhenOperandCombinationIsUnsupported(String expression) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOf(InvalidExpressionException.class)
                .satisfies(e -> assertThat(((InvalidExpressionException) e).getErrorCode())
                        .isEqualTo(ErrorCode.AO_INVALID_OPERAND_PAIRS));
    }

    // ── insufficient operand ──────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "\"a\" = 1 Matches",
            "(1 && Like = 4)",
            "Like = [] || 1",
            "(1 = \"asda\")!",
            "[] IsTypeOf  "
    })
    void validateThrowsInsufficientOperandWhenOperandsAreMissing(String expression) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOf(InvalidExpressionException.class)
                .satisfies(e -> assertThat(((InvalidExpressionException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INSUFFICIENT_OPERAND));
    }
}
