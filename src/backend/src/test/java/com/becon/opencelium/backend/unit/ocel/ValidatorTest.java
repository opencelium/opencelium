package com.becon.opencelium.backend.unit.ocel;

import com.becon.opencelium.backend.ocel.ShallowEvaluatorType;
import com.becon.opencelium.backend.ocel.Validator;
import com.becon.opencelium.backend.ocel.exception.ErrorCode;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import com.becon.opencelium.backend.ocel.token.Token;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link Validator}.
 *
 * {@link WithoutShallowEvaluator} covers first-level syntax checks (parentheses,
 * tokens, operand count) using {@link ShallowEvaluatorType#NONE}.
 * {@link WithPostfixShallowEvaluator} covers semantic operator-operand type checks
 * using {@link ShallowEvaluatorType#POSTFIX}.
 *
 * No Spring context is loaded. The validator is instantiated directly.
 * Run with: ./gradlew test
 */
@DisplayName("OCEL Expression Validator")
class ValidatorTest {

    private static void assertInvalid(Validator validator, String expression, ErrorCode expected) {
        assertThatThrownBy(() -> validator.validate(expression))
                .isInstanceOfSatisfying(InvalidExpressionException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(expected));
    }

    @Nested
    @DisplayName("without shallow evaluator — syntax checks only")
    class WithoutShallowEvaluator {

        private final Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.NONE);

        // ── null / empty / blank ──────────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] input={0}")
        @NullSource
        @EmptySource
        @ValueSource(strings = {" ", "   "})
        void validateThrowsInvalidExpressionExceptionWhenInputIsNullOrBlank(String expression) {
            assertThatThrownBy(() -> validator.validate(expression))
                    .isInstanceOf(InvalidExpressionException.class);
        }

        // ── valid: comparison operators ───────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "1 = 1",
                "1 != 2",
                "3 > 2",
                "2 < 3",
                "3 >= 3",
                "2 <= 3",
                "\"abc\" = \"abc\"",
        })
        void validateDoesNotThrowWhenExpressionUsesComparisonOperators(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── valid: logical operators ──────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "1 = 1 && 2 = 2",
                "1 = 1 || 2 = 3",
                "!(1 = 2)",
                "(1 = 1) && (2 = 2)",
        })
        void validateDoesNotThrowWhenExpressionUsesLogicalOperators(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── valid: custom keywords ────────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf NUM",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf STR",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} Matches '[a-z]+'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} Like '%abc%'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotLike '%abc%'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} Contains 'hello'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotContains 'hello'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsNull",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotNull",
        })
        void validateDoesNotThrowWhenExpressionUsesCustomKeywords(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── valid: spacing variants ───────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} || 1 = 3",
                "#{%60b8d4c8f1d4a53d3c2f84d1%}||1=3",
                "#{%60b8d4c8f1d4a53d3c2f84d1%}    ||    1    =    3",
                " #{%60b8d4c8f1d4a53d3c2f84d1%} || 1 = 3 ",
        })
        void validateDoesNotThrowWhenExpressionHasVariousSpacing(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── valid: parenthesized expressions ─────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "(1 = 1)",
                "((1 = 1))",
                "(1 = 1) && (2 = 2)",
                "((1 = 1) || (2 = 2)) && 3 = 3",
        })
        void validateDoesNotThrowWhenExpressionIsParenthesized(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 1. Integrity of the Reference Tag (The #{%id%} syntax) ───────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'#{%}',              UNEXPECTED_END_OF_EXPRESSION",   // Empty ID
                "'#{%validID',        UNEXPECTED_END_OF_EXPRESSION",   // Unclosed tag
                "'{%validID%}',       INVALID_TOKEN_FOUND",            // Missing #
                "'#{%id1%} #{%id2%}', INVALID_TOKEN_FOUND",            // Two refs without an operator
        })
        void validateThrowsExpectedErrorCodeWhenReferenceIsMalformed(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 2. Invalid parentheses ────────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'(1 = \"asda\"))',   INVALID_PARENTHESES",
                "'(1 = \"asda\"',    INVALID_PARENTHESES",
                "'(1 = \"asda\")(',  INVALID_PARENTHESES",
                "'((1 = \"asda\")',  INVALID_PARENTHESES",
                "'1 = \"asda\")',    INVALID_PARENTHESES",
                "')1 = \"asda\"(',   INVALID_PARENTHESES",
                "')',                INVALID_PARENTHESES",
                "'(',                INVALID_PARENTHESES",
        })
        void validateThrowsInvalidParenthesesWhenParenthesesAreUnbalanced(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 3. Invalid token ──────────────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'ewfwefw = 1',                  INVALID_TOKEN_FOUND",
                "'(1 = \"asda\") && a(3 = a)',   INVALID_TOKEN_FOUND",
                "'1 = \"asda\" || asda',         INVALID_TOKEN_FOUND",
                "'([dsa]a = \"asda\")',           INVALID_TOKEN_FOUND",
                "'true = a\"asda\")',             INVALID_TOKEN_FOUND",
                "'(1a = \"asda\")',               INVALID_TOKEN_FOUND",
        })
        void validateThrowsInvalidTokenWhenExpressionContainsInvalidToken(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 4. Insufficient operand ───────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'\"a\" = 1 Matches',   INSUFFICIENT_OPERAND",
                "'(1 && Like = 4)',     INSUFFICIENT_OPERAND",
                "'Like = [] || 1',      INSUFFICIENT_OPERAND",
                "'(1 = \"asda\")!',     INSUFFICIENT_OPERAND",
                "'[] IsTypeOf  ',       INSUFFICIENT_OPERAND",
        })
        void validateThrowsInsufficientOperandWhenOperandsAreMissing(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 5. Valid: IsEmpty and NotEmpty operators ───────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsEmpty",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotEmpty",
                "[] IsEmpty",
                "[] NotEmpty",
                "(#{%60b8d4c8f1d4a53d3c2f84d1%} IsEmpty) && (#{%60b8d4c8f1d4a53d3c2f84d1%} NotEmpty)",
        })
        void validateDoesNotThrowWhenExpressionUsesIsEmptyAndNotEmptyOperators(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 6. Valid: null and boolean literals ───────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "null = null",
                "true = false",
                "false = true",
                "true = true",
                "null != true",
        })
        void validateDoesNotThrowWhenExpressionUsesNullAndBooleanLiterals(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 7. Valid: IsTypeOf with all type keywords ─────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf NUM",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf STR",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf ARR",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf OBJ",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf BOOL",
        })
        void validateDoesNotThrowWhenExpressionUsesAllIsTypeOfTypeKeywords(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 8. Valid: remaining binary custom operators ───────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} ContainsSubStr 'sub'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotContainsSubStr 'sub'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} AllowList ['a','b']",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} DenyList ['a','b']",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} RegExp '[a-z]+'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} PropertyExists 'field'",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} PropertyNotExists 'field'",
        })
        void validateDoesNotThrowWhenExpressionUsesRemainingBinaryCustomOperators(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 9. Valid: chained NOT operators ──────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "!(1 = 2) && !(3 = 4)",
                "!!(1 = 1)",
                "!(1 = 2) || !(2 = 3)",
        })
        void validateDoesNotThrowWhenExpressionHasChainedNotOperators(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 10. Unclosed string / array literal ──────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'\"unclosed',  UNEXPECTED_END_OF_EXPRESSION",
                "'[1, 2',       UNEXPECTED_END_OF_EXPRESSION",
        })
        void validateThrowsUnexpectedEndOfExpressionWhenLiteralIsUnclosed(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 11. NOT operator with no right operand ────────────────────────────

        @Test
        void validateThrowsInsufficientOperandWhenNotOperatorHasNoRightOperand() {
            assertInvalid(validator, "!", ErrorCode.INSUFFICIENT_OPERAND);
        }

        // ── 12. Binary operator missing one operand ───────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'= 1',       INSUFFICIENT_OPERAND",
                "'1 =',       INSUFFICIENT_OPERAND",
                "'&& 1 = 2',  INSUFFICIENT_OPERAND",
                "'1 = 2 ||',  INSUFFICIENT_OPERAND",
        })
        void validateThrowsInsufficientOperandWhenBinaryOperatorIsMissingAnOperand(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }
    }

    @Nested
    @DisplayName("with POSTFIX shallow evaluator — semantic checks")
    class WithPostfixShallowEvaluator {

        private final Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.POSTFIX);

        // ── 1. Unsupported operand ────────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'\"a\" > #{%60b8d4c8f1d4a53d3c2f84d1%}',              UNSUPPORTED_OPERAND",
                "'(1 && #{%60b8d4c8f1d4a53d3c2f84d1%} = 4)',           UNSUPPORTED_OPERAND",
                "'[] <= #{%60b8d4c8f1d4a53d3c2f84d1%} || true',        UNSUPPORTED_OPERAND",
                "'#{%60b8d4c8f1d4a53d3c2f84d1%} > \"asda\"',           UNSUPPORTED_OPERAND",
                "'#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf true',        UNSUPPORTED_OPERAND",
        })
        void validateThrowsUnsupportedOperandWhenOperandTypeIsIncompatible(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 2. Invalid operand pairs ──────────────────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'(1 && 6 = 4)',      AO_INVALID_OPERAND_PAIRS",
                "'[] = [] || 1',     AO_INVALID_OPERAND_PAIRS",
                "'[] IsTypeOf true',  AO_INVALID_OPERAND_PAIRS",
        })
        void validateThrowsInvalidOperandPairsWhenOperandCombinationIsUnsupported(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 3. Valid: both operands are compatible literals ───────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "1 = 1",
                "1 != 2",
                "2 > 1",
                "1 < 2",
                "2 >= 2",
                "1 <= 2",
                "\"a\" = \"a\"",
                "\"a\" != \"b\"",
        })
        void validateDoesNotThrowWhenBothOperandsAreLiteralsOfCompatibleTypes(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 4. Valid: both operands are references ────────────────────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} = #{%60b8d4c8f1d4a53d3c2f84d1%}",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} != #{%60b8d4c8f1d4a53d3c2f84d1%}",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} = #{%60b8d4c8f1d4a53d3c2f84d1%} && 1 = 1",
        })
        void validateDoesNotThrowWhenBothOperandsAreReferences(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 5. Valid: reference with right-sided unary operator ───────────────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @ValueSource(strings = {
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsNull",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotNull",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} IsEmpty",
                "#{%60b8d4c8f1d4a53d3c2f84d1%} NotEmpty",
        })
        void validateDoesNotThrowWhenReferenceIsUsedWithRightSidedUnaryOperator(String expression) {
            assertThatCode(() -> validator.validate(expression)).doesNotThrowAnyException();
        }

        // ── 6. Invalid association: consecutive literals without operator ──────

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'1 1',       INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS",
                "'\"a\" \"b\"', INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS",
        })
        void validateThrowsInvalidAssociationBetweenOperatorAndOperandsWhenConsecutiveLiteralsHaveNoOperator(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }

        // ── 7. Unsupported operand: literal on left incompatible with operator ─

        @ParameterizedTest(name = "[{index}] \"{0}\"")
        @CsvSource({
                "'\"a\" >= #{%60b8d4c8f1d4a53d3c2f84d1%}', UNSUPPORTED_OPERAND",
                "'\"a\" < #{%60b8d4c8f1d4a53d3c2f84d1%}',  UNSUPPORTED_OPERAND",
                "'\"a\" <= #{%60b8d4c8f1d4a53d3c2f84d1%}', UNSUPPORTED_OPERAND",
        })
        void validateThrowsUnsupportedOperandWhenLiteralOnLeftIsIncompatibleWithBinaryOperator(String expression, ErrorCode expected) {
            assertInvalid(validator, expression, expected);
        }
    }

    @Nested
    @DisplayName("convenience methods — isValid and validateAndTokenize")
    class ConvenienceMethods {

        private final Validator validator = Validator.defaultValidator();

        // ── isValid ───────────────────────────────────────────────────────────

        @Test
        void isValidReturnsTrueWhenExpressionIsValid() {
            assertThat(validator.isValid("1 = 1")).isTrue();
        }

        @ParameterizedTest(name = "[{index}] input={0}")
        @NullSource
        @EmptySource
        @ValueSource(strings = {" ", "   "})
        void isValidReturnsFalseWhenExpressionIsBlank(String expression) {
            assertThat(validator.isValid(expression)).isFalse();
        }

        @Test
        void isValidReturnsFalseWhenExpressionIsInvalid() {
            assertThat(validator.isValid("ewfwefw = 1")).isFalse();
        }

        // ── validateAndTokenize ───────────────────────────────────────────────

        @Test
        void validateAndTokenizeReturnsNonEmptyListWhenExpressionIsValid() {
            List<Token> tokens = validator.validateAndTokenize("1 = 1");
            assertThat(tokens).isNotNull().hasSize(3);
        }

        @ParameterizedTest(name = "[{index}] input={0}")
        @NullSource
        @EmptySource
        void validateAndTokenizeThrowsInvalidExpressionExceptionWhenExpressionIsBlank(String expression) {
            assertThatThrownBy(() -> validator.validateAndTokenize(expression))
                    .isInstanceOf(InvalidExpressionException.class);
        }

        @Test
        void validateAndTokenizeThrowsInvalidExpressionExceptionWhenExpressionIsInvalid() {
            assertThatThrownBy(() -> validator.validateAndTokenize("ewfwefw = 1"))
                    .isInstanceOf(InvalidExpressionException.class);
        }
    }
}
