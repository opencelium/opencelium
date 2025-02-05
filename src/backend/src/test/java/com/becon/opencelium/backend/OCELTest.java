package com.becon.opencelium.backend;

import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;


public class OCELTest {
    ExpressionProcessor expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);

    @Test
    public void logical() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("true && false")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false")); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false && (true || false)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true && (true || false)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(false && true) || (true && true)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false && false && false")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true && true && true")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true || (false && false)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(true && false)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(false || false)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(true && true) || false")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("false || (true && (false || true))")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(true && false) || (false && false)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("((true || false) && true) || (false && true)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((false || false) && (false && false)) || false")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true || (false && (true || false))")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(true || false) && (true || (false && false))")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(false || (true && false))")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true || (false || (false && true))")); // true
    }


    @Test
    public void comparisonLogical() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("1 < 2 && 3 != 4")); // true && true -> true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("1 = 2 || 4 <= 6")); // false || true -> true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 >= 10 && 8 < 3")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(3 > 2) && (5 = 5)")); // true && true -> true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(1 < 1) || (2 > 3)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(4 <= 6) && (7 != 8)")); // true && true -> true

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("0 < 0 && (1 != 1 || 2 < 3)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("1 < 2 && (3 >= 3)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(1 = 1) || (2 < 3)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 < 2 && 2 > 5")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("3 > 2 && 10 >= 10")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("4 = 4 || (5 > 6 && 7 != 8)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(1 < 2 && 3 != 3)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(2 >= 3 || 4 < 4)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(1 > 2) || (2 = 2)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("1 < 3 || (4 >= 6 && 7 != 7)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(1 < 2 && 3 = 3) || (5 >= 5 && 4 < 2)")); // true

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("((1 < 2) && (3 != 4)) || (4 > 3)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((1 = 1) && (0 >= 1)) || false")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("1 < 5 || (3 <= 3 && (2 > 1))")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(5 >= 2) && (3 < 4 || 1 > 0)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(0 < 1)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("2 > 1 || (0 <= 0 && 3 != 3)")); // true
    }

    @Test
    public void dateAndNumberComparisonLogical() throws InvalidExpressionException {
        // Complex date-only comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"2024-05-05\" < \"2025-01-01\" && \"2023-11-11\" <= \"2023-11-11\") || (\"2022-08-08\" > \"2022-01-01\")")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(\"2023-12-31\" <= \"2024-01-01\") && (\"2025-06-01\" != \"2025-06-01\")")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"2024-03-15\" < \"2024-04-01\" || \"2023-03-15\" > \"2022-05-05\") && (\"2025-01-01\" >= \"2024-12-31\")")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(\"2025-01-01\" < \"2025-12-31\" || (\"2022-06-15\" >= \"2022-06-16\")) && \"2023-01-01\" = \"2023-01-02\"")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"2023-05-10\" < \"2023-05-11\" || (\"2022-05-01\" >= \"2022-04-01\" && \"2024-11-01\" != \"2024-11-02\")) && \"2024-01-01\" < \"2024-12-01\"")); // true

        // Combination of date and number comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"2024-10-10\" > \"2023-10-09\" && 5 < 10) || (\"2025-01-01\" < \"2026-01-01\" && 20 > 15)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(\"2024-12-31\" <= \"2024-12-30\" && 7 >= 10) || (\"2025-01-01\" > \"2026-01-01\" && 15 = 15)")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("5 = 5 && (\"2023-01-01\" <= \"2023-12-31\" || 12 > 11) && \"2022-02-02\" != \"2023-02-02\"")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(\"2023-06-01\" >= \"2023-06-01\" && 8 > 9) || (\"2024-01-01\" < \"2024-01-01\" && 2 = 2)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"2022-01-01\" < \"2023-01-01\" && 50 >= 25) || (10 <= 20 && \"2025-12-31\" > \"2024-12-31\")")); // true
    }


    @Test
    public void typeAndNullComparisonLogical() throws InvalidExpressionException {
        // Type checking and null-checking test cases
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"text\" IsTypeOf STR && 5 IsTypeOf NUM")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("[1, 2, 3] IsTypeOf ARR && \"value\" NotNull")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("null IsTypeOf OBJ || 123 IsTypeOf STR")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true IsTypeOf BOOL && false IsTypeOf BOOL")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 IsTypeOf BOOL || \"test\" IsTypeOf NUM")); // false

        // Null-checking operators
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("null IsNull && \"non-null\" NotNull")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 IsNull || null NotNull")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("null IsNull && null IsTypeOf OBJ")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("[1, 2, 3] NotNull && [] IsEmpty")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || [5] IsEmpty")); // false

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("true IsTypeOf ARR || [1] IsEmpty")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("[] IsEmpty && null IsNull")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("[\"value\"] IsEmpty || \"non-empty\" IsNull")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("5 NotNull && \"string\" NotNull && [] IsEmpty")); // true

        // Combining type and null checks
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"string\" IsTypeOf STR && null IsNull && 10 IsTypeOf NUM")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null IsNull && \"value\" IsTypeOf ARR")); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("5 IsTypeOf NUM && null IsNull && !([1, 2] IsEmpty)")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("true IsTypeOf BOOL && !([1] IsEmpty) && \"test\" NotNull")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || 100 IsTypeOf BOOL || [1, 2, 3] IsEmpty")); // false

        // Complex combinations
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(\"test\" IsTypeOf STR && !([1,2,3] IsEmpty)) || null IsNull")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(!(null NotNull) && \"\" NotNull) || 3 IsTypeOf ARR")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("5 IsTypeOf NUM && [1,2,3] NotNull && \"text\" NotNull")); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(null IsNull && [] IsEmpty) || (true IsTypeOf BOOL && false IsTypeOf BOOL)")); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || \"string\" IsTypeOf ARR || [1] IsEmpty")); // false
    }

    @Test
    public void invalidExpressions() {
        checkExceptions("[wvdkws] IsEmpty");                     // Invalid type within IsEmpty
        checkExceptions("A && B");                               // Undefined variables
        checkExceptions("[1, \"a\"] IsEmpty");                   // Mixed type in array
        checkExceptions("[12.2, [1]] IsTypeOf NUM");             // Array contains incompatible nested type
        checkExceptions("\"text\" && false");                    // String operand in logical expression
        checkExceptions("\"unclosedString);");                   // Malformed string literal
        checkExceptions("[1, true, \"string\"] IsEmpty");        // Array with incompatible element types
        checkExceptions("[\"string\", null, 5.5] IsEmpty");      // Mixed type array without operator
        checkExceptions("5 > \"text\"");                         // Incompatible types for comparison
        checkExceptions("[\"string\", [1, 2]] IsEmpty");         // Array with incompatible nested array
        checkExceptions("[] && true");                           // Null in array with logical operator
        checkExceptions("[[1, 2], \"text\"] IsEmpty");           // Mixed type with nested array
        checkExceptions("[1, 2] || [\"a\", \"b\"]");             // Array used with logical operator
    }

    public void checkExceptions(String s) {
        Assertions.assertThrows(InvalidExpressionException.class, () -> {
            try {
                expressionProcessor.evaluate(s);
            } catch (InvalidExpressionException e) {
                System.out.println(s + " --> " + e.getMessage());
                throw e;
            }
        });
    }
}
