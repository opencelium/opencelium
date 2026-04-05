package com.becon.opencelium.backend.unit.ocel;

import com.becon.opencelium.backend.ocel.ShallowEvaluatorType;
import com.becon.opencelium.backend.ocel.Validator;
import com.becon.opencelium.backend.ocel.exception.ErrorCode;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class ValidatorTest {
    private final Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.POSTFIX);

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
        assertDoesNotThrow(() -> validator.validate(expression));
    }

    @Test
    void validateThrowsInvalidParenthesesWhenParenthesesAreUnbalanced() {
        InvalidExpressionException ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 = \"asda\"))"));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 = \"asda\""));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 = \"asda\")("));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("((1 = \"asda\")"));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("1 = \"asda\")"));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("((1 = \"asda\"))("));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate(")1 = \"asda\"("));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate(")"));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("("));
        assertEquals(ErrorCode.INVALID_PARENTHESES, ex.getErrorCode());
    }

    @Test
    void validateThrowsInvalidTokenWhenExpressionContainsInvalidValue() {
        InvalidExpressionException ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("ewfwefw = 1"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 = \"asda\") && a(3 = a)"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("1 = \"asda\" || asda"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("([dsa]a = \"asda\")"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("true = a\"asda\")"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1a = \"asda\")"));
        assertEquals(ErrorCode.INVALID_TOKEN_FOUND, ex.getErrorCode());
    }

    @Test
    void validateThrowsUnsupportedOperandWhenOperandTypeIsIncompatible() {
        InvalidExpressionException ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("\"a\" > #{%60b8d4c8f1d4a53d3c2f84d1%}"));
        assertEquals(ErrorCode.UNSUPPORTED_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 && #{%60b8d4c8f1d4a53d3c2f84d1%} = 4)"));
        assertEquals(ErrorCode.UNSUPPORTED_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("[] <= #{%60b8d4c8f1d4a53d3c2f84d1%} || true"));
        assertEquals(ErrorCode.UNSUPPORTED_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("#{%60b8d4c8f1d4a53d3c2f84d1%} > \"asda\""));
        assertEquals(ErrorCode.UNSUPPORTED_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("#{%60b8d4c8f1d4a53d3c2f84d1%} IsTypeOf true"));
        assertEquals(ErrorCode.UNSUPPORTED_OPERAND, ex.getErrorCode());
    }

    @Test
    void validateThrowsInvalidOperandPairsWhenOperandCombinationIsUnsupported() {
        InvalidExpressionException ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 && 6 = 4)"));
        assertEquals(ErrorCode.AO_INVALID_OPERAND_PAIRS, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("[] = [] || 1"));
        assertEquals(ErrorCode.AO_INVALID_OPERAND_PAIRS, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("[] IsTypeOf true"));
        assertEquals(ErrorCode.AO_INVALID_OPERAND_PAIRS, ex.getErrorCode());
    }

    @Test
    void validateThrowsInsufficientOperandWhenOperandsAreMissing() {
        InvalidExpressionException ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("\"a\" = 1 Matches"));
        assertEquals(ErrorCode.INSUFFICIENT_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 && Like = 4)"));
        assertEquals(ErrorCode.INSUFFICIENT_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("Like = [] || 1"));
        assertEquals(ErrorCode.INSUFFICIENT_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("(1 = \"asda\")!"));
        assertEquals(ErrorCode.INSUFFICIENT_OPERAND, ex.getErrorCode());

        ex = assertThrows(InvalidExpressionException.class, () -> validator.validate("[] IsTypeOf  "));
        assertEquals(ErrorCode.INSUFFICIENT_OPERAND, ex.getErrorCode());
    }
}
