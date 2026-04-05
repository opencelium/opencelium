package com.becon.opencelium.backend.unit.ocel;

import com.becon.opencelium.backend.ocel.*;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;

class ExpressionProcessorTest {

    private static final ExpressionProcessor expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);
    private static final Validator validator = Validator.withCustomShallowEvaluator(ShallowEvaluatorType.POSTFIX);

    private static final HashMap<String, Object> referenceValues = new HashMap<>();
    private static final Function<String, Object> referenceExtractor = referenceValues::get;

    static {
        // request data
        referenceValues.put("{null}", null);
        referenceValues.put("{bool_true}", true);
        referenceValues.put("{bool_false}", false);
        referenceValues.put("{url}", "https://www.google.com");
        referenceValues.put("{number1}", 1);
        referenceValues.put("{number2}", 2);
        referenceValues.put("{number_1}", -1);
        referenceValues.put("{double1}", 1.0);
        referenceValues.put("{double2}", 2.0);
        referenceValues.put("{double_2}", -2.0);
        referenceValues.put("{name}", "Bob");
        referenceValues.put("{date_1}", "2020-01-01");
        referenceValues.put("{date_2}", "2020-02-02");
        referenceValues.put("{email}", "bob@gmail.com");
        referenceValues.put("{phone}", "1234567890");
        referenceValues.put("{array_of_numbers}", List.of(1, 2, 3, 4, 5));
        referenceValues.put("{array_of_strings}", List.of("hello", "world"));
        referenceValues.put("{array_of_bool}", List.of(true, false));
        referenceValues.put("{array_of_objects}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
        referenceValues.put("{person_object}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});

        // webhook
        referenceValues.put("${null}", null);
        referenceValues.put("${bool_true}", true);
        referenceValues.put("${url}", "https://www.google.com");
        referenceValues.put("${number1}", 1);
        referenceValues.put("${number2}", 2);
        referenceValues.put("${number_1}", -1);
        referenceValues.put("${double1}", 1.0);
        referenceValues.put("${double2}", 2.0);
        referenceValues.put("${double_2}", -2.0);
        referenceValues.put("${name}", "Bob");
        referenceValues.put("${date_1}", "2020-01-01");
        referenceValues.put("${date_2}", "2020-02-02");
        referenceValues.put("${email}", "bob@gmail.com");
        referenceValues.put("${phone}", "1234567890");
        referenceValues.put("${array_of_numbers}", List.of(1, 2, 3, 4, 5));
        referenceValues.put("${array_of_strings}", List.of("hello", "world"));
        referenceValues.put("${array_of_bool}", List.of(true, false));
        referenceValues.put("${array_of_objects}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));

        // wrapped direct
        referenceValues.put("{%#ffffff.(response).null%}", null);
        referenceValues.put("{%#ffffff.(response).bool_true%}", true);
        referenceValues.put("{%#ffffff.(request).url%}", "https://www.google.com");
        referenceValues.put("{%#ffffff.(request).number1%}", 1);
        referenceValues.put("{%#ffffff.(request).number2%}", 2);
        referenceValues.put("{%#ffffff.(request).number_1%}", -1);
        referenceValues.put("{%#ffffff.(request).double1%}", 1.0);
        referenceValues.put("{%#ffffff.(request).double2%}", 2.0);
        referenceValues.put("{%#ffffff.(request).double_2%}", -2.0);
        referenceValues.put("{%#ffffff.(request).name%}", "Bob");
        referenceValues.put("{%#ffffff.(request).date_1%}", "2020-01-01");
        referenceValues.put("{%#ffffff.(request).date_2%}", "2020-02-02");
        referenceValues.put("{%#ffffff.(response).email%}", "bob@gmail.com");
        referenceValues.put("{%#ffffff.(request).phone%}", "1234567890");
        referenceValues.put("{%#ffffff.(response).array_of_numbers%}", List.of(1, 2, 3, 4, 5));
        referenceValues.put("{%#ffffff.(request).array_of_strings%}", List.of("hello", "world"));
        referenceValues.put("{%#ffffff.(response).array_of_bool%}", List.of(true, false));
        referenceValues.put("{%#ffffff.(request).array_of_objects%}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
        referenceValues.put("{%#ffffff.(request).object%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "A");
        }});
        referenceValues.put("{%#ffffff.(request).body.$.person%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});
        referenceValues.put("{%#ffffff.(request).body.$.person.address%}", new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Obid");
            put("address", "Tashkent");
        }});

        // enhancement
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c00%}", null);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c01%}", 1);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c02%}", 2);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c03%}", -1);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c04%}", 1.0);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c05%}", 2.0);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c06%}", -2.0);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c12%}", true);
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c13%}", "https://www.google.com");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c15%}", "Bob");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c16%}", "2020-01-01");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c17%}", "2020-02-02");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c18%}", "bob@gmail.com");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c19%}", "1234567890");
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c20%}", List.of(1, 2, 3, 4, 5));
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c21%}", List.of("hello", "world"));
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c22%}", List.of(true, false));
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c23%}", List.of(new LinkedHashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
    }

    // ── current_date / current_date_time / current_time_mills / date_parse ────

    @Test
    void evaluateCurrentDateFunctionReturnsFormattedDateForTimezone() throws InvalidExpressionException {
        Assertions.assertEquals(
                LocalDate.now(ZoneId.of("America/New_York")).toString(),
                expressionProcessor.evaluate("current_date(\"America/New_York\")")
        );
        Assertions.assertEquals(
                LocalDate.now(ZoneOffset.of("+02:00")).toString(),
                expressionProcessor.evaluate("current_date(\"+02:00\")")
        );
    }

    @Test
    void evaluateCurrentDateFunctionSupportsComparisonOperators() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("current_date() = current_date(\"UTC\")"));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("current_date() > \"2012-12-12\""));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("current_date() < \"2032-12-12\""));
    }

    @Test
    void evaluateCurrentDateTimeFunctionSupportsComparisonOperators() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("current_date_time() > \"2012-12-12T12:12:12\""));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("current_date_time() < \"2032-12-12T12:12:12\""));
    }

    @Test
    void evaluateCurrentTimeMillsFunctionReturnsTimestampComparisons() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("current_time_mills() <= current_time_mills()"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("current_time_mills() > current_time_mills()"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("current_time_mills() > 1141242141254"));
    }

    @Test
    void evaluateDateParseComparesFormattedDatesAcrossFormats() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("date_parse(\"2024/12/22\",\"yyyy/MM/dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")"));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("date_parse(\"12-21-2000\",\"MM-dd-yyyy\") < date_parse(\"2024/11/22\", \"yyyy/MM/dd\")"));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("date_parse(current_date(),\"yyyy-MM-dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")"));
    }

    // ── logical / comparison / type operators (literal values) ───────────────

    @Test
    void evaluateHandlesLogicalBooleanExpressionsCorrectly() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("true && false"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false && (true || false)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true && (true || false)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(false && true) || (true && true)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("false && false && false"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true && true && true"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true || (false && false)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(true && false)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(false || false)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(true && true) || false"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("false || (true && (false || true))"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(true && false) || (false && false)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("((true || false) && true) || (false && true)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((false || false) && (false && false)) || false"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true || (false && (true || false))"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(true || false) && (true || (false && false))"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(false || (true && false))"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true || (false || (false && true))"));
    }

    @Test
    void evaluateHandlesComparisonWithLogicalOperatorsCorrectly() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("1 < 2 && 3 != 4"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("1 = 2 || 4 <= 6"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 >= 10 && 8 < 3"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(3 > 2) && (5 = 5)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(1 < 1) || (2 > 3)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(4 <= 6) && (7 != 8)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("0 < 0 && (1 != 1 || 2 < 3)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("1 < 2 && (3 >= 3)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(1 = 1) || (2 < 3)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 < 2 && 2 > 5"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("3 > 2 && 10 >= 10"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("4 = 4 || (5 > 6 && 7 != 8)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(1 < 2 && 3 != 3)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(2 >= 3 || 4 < 4)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(1 > 2) || (2 = 2)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("1 < 3 || (4 >= 6 && 7 != 7)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(1 < 2 && 3 = 3) || (5 >= 5 && 4 < 2)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("((1 < 2) && (3 != 4)) || (4 > 3)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((1 = 1) && (0 >= 1)) || false"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("1 < 5 || (3 <= 3 && (2 > 1))"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(5 >= 2) && (3 < 4 || 1 > 0)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(0 < 1)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("2 > 1 || (0 <= 0 && 3 != 3)"));
    }

    @Test
    void evaluateCombinesDateAndNumberComparisonsWithLogicalOperators() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"2024-05-05\" < \"2025-01-01\" && \"2023-11-11\" <= \"2023-11-11\") || (\"2022-08-08\" > \"2022-01-01\")"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(\"2023-12-31\" <= \"2024-01-01\") && (\"2025-06-01\" != \"2025-06-01\")"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"2024-03-15\" < \"2024-04-01\" || \"2023-03-15\" > \"2022-05-05\") && (\"2025-01-01\" >= \"2024-12-31\")"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(\"2025-01-01\" < \"2025-12-31\" || (\"2022-06-15\" >= \"2022-06-16\")) && \"2023-01-01\" = \"2023-01-02\""));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"2023-05-10\" < \"2023-05-11\" || (\"2022-05-01\" >= \"2022-04-01\" && \"2024-11-01\" != \"2024-11-02\")) && \"2024-01-01\" < \"2024-12-01\""));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"2024-10-10\" > \"2023-10-09\" && 5 < 10) || (\"2025-01-01\" < \"2026-01-01\" && 20 > 15)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(\"2024-12-31\" <= \"2024-12-30\" && 7 >= 10) || (\"2025-01-01\" > \"2026-01-01\" && 15 = 15)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("5 = 5 && (\"2023-01-01\" <= \"2023-12-31\" || 12 > 11) && \"2022-02-02\" != \"2023-02-02\""));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(\"2023-06-01\" >= \"2023-06-01\" && 8 > 9) || (\"2024-01-01\" < \"2024-01-01\" && 2 = 2)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"2022-01-01\" < \"2023-01-01\" && 50 >= 25) || (10 <= 20 && \"2025-12-31\" > \"2024-12-31\")"));
    }

    @Test
    void evaluateCombinesTypeAndNullChecksWithLogicalOperators() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("\"text\" IsTypeOf STR && 5 IsTypeOf NUM"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("[1, 2, 3] IsTypeOf ARR && \"value\" NotNull"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("null IsTypeOf OBJ || 123 IsTypeOf STR"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true IsTypeOf BOOL && false IsTypeOf BOOL"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 IsTypeOf BOOL || \"test\" IsTypeOf NUM"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("null IsNull && \"non-null\" NotNull"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("5 IsNull || null NotNull"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("null IsNull && null IsTypeOf OBJ"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("[1, 2, 3] NotNull && [] IsEmpty"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || [5] IsEmpty"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("true IsTypeOf ARR || [1] IsEmpty"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("[] IsEmpty && null IsNull"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("[\"value\"] IsEmpty || \"non-empty\" IsNull"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("5 NotNull && \"string\" NotNull && [] IsEmpty"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("\"string\" IsTypeOf STR && null IsNull && 10 IsTypeOf NUM"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null IsNull && \"value\" IsTypeOf ARR"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("5 IsTypeOf NUM && null IsNull && !([1, 2] IsEmpty)"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("true IsTypeOf BOOL && !([1] IsEmpty) && \"test\" NotNull"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || 100 IsTypeOf BOOL || [1, 2, 3] IsEmpty"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(\"test\" IsTypeOf STR && !([1,2,3] IsEmpty)) || null IsNull"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(!(null NotNull) && \"\" NotNull) || 3 IsTypeOf ARR"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("5 IsTypeOf NUM && [1,2,3] NotNull && \"text\" NotNull"));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(null IsNull && [] IsEmpty) || (true IsTypeOf BOOL && false IsTypeOf BOOL)"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("null NotNull || \"string\" IsTypeOf ARR || [1] IsEmpty"));
    }

    @Test
    void evaluateThrowsInvalidExpressionExceptionForInvalidExpressions() {
        assertThrowsInvalidExpression("[wvdkws] IsEmpty");
        assertThrowsInvalidExpression("A && B");
        assertThrowsInvalidExpression("\"text\" && false");
        assertThrowsInvalidExpression("\"unclosedString);");
        assertThrowsInvalidExpression("5 > \"text\"");
        assertThrowsInvalidExpression("[] && true");
        assertThrowsInvalidExpression("[1, 2] || [\"a\", \"b\"]");
    }

    // ── logical / comparison operators (reference values) ────────────────────

    @Test
    void evaluateHandlesLogicalOperatorsWithReferenceValues() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!${bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!#{%600d5b5f4f3e2c1d8a7b6c12%}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!${bool_true} && ({bool_true} || !{bool_true})", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{bool_true} && ({%#ffffff.(response).bool_true%} || !#{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!${bool_true} && {%#ffffff.(response).bool_true%} || (#{%600d5b5f4f3e2c1d8a7b6c12%} && ${bool_true})", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!#{%600d5b5f4f3e2c1d8a7b6c12%} && !#{%600d5b5f4f3e2c1d8a7b6c12%} && !${bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%} && {%#ffffff.(response).bool_true%}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{bool_true} || (!{%#ffffff.(response).bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true})", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(!${bool_true} || #{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!({%#ffffff.(response).bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%}) || !${bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${bool_true} || ({%#ffffff.(response).bool_true%} && (!{bool_true} || {%#ffffff.(response).bool_true%}))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("({bool_true} && !{%#ffffff.(response).bool_true%}) || (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("((#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && {bool_true}) || (!{%#ffffff.(response).bool_true%} && ${bool_true})", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((!${bool_true} || !#{%600d5b5f4f3e2c1d8a7b6c12%}) && (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})) || !${bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} || (!{%#ffffff.(response).bool_true%} && ({bool_true} || ${bool_true}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && (#{%600d5b5f4f3e2c1d8a7b6c12%} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(!#{%600d5b5f4f3e2c1d8a7b6c12%} || ({bool_true} && !${bool_true}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${bool_true} || (!{bool_true} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", referenceExtractor));
    }

    @Test
    void evaluateHandlesEqualityAndInequalityWithReferenceValues() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} = {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%}= ${number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} ={double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}=${double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{date_1}= ${date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%} =${date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1}!= {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} !=${number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1}!={double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%} != ${double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_1} !=${date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%}!= ${date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} = {number2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} = #{%600d5b5f4f3e2c1d8a7b6c02%}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} ={double2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}= #{%600d5b5f4f3e2c1d8a7b6c05%}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_1} = ${date_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%}= #{%600d5b5f4f3e2c1d8a7b6c17%}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} !={number2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} != #{%600d5b5f4f3e2c1d8a7b6c02%}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} != {double2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}!= #{%600d5b5f4f3e2c1d8a7b6c05%}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{date_1} !=${date_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%} != #{%600d5b5f4f3e2c1d8a7b6c17%}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} = 1) && (${double1} = 1.0) && ({date_1} = \"2020-01-01\")", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} != 1) || (${double2} = 1.0)", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} = 1) && ((${double1} = 1.0) || ({date_2} != \"2020-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} = {number2}) && ((${double1} != {double2}) || ({date_1} != ${date_2}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} != {number2}) && ((${double1} = 1.0) && ({date_1} = ${date_1}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(((${number1} = 1) && (${double2} != 1.0)) || ({date_1} = ${date_1}))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(((${number1} != 1) || (${double1} != 1.0)) && ({date_2} != \"2020-02-02\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(({number1} = 1) && (({double1} = 1.0) || ({double2} = 2.0)) && ({date_1} = \"2020-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("((({number1} = -1) || ({double_2} = -2.0)) && ({date_2} != ${date_1}))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(((${number1} = 1) && (${double1} = 1.0)) && ({date_1} = \"2020-01-01\")) || ({number_1} = -1)", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((({number1} = 2) && ({double1} = 1.0)) || !(${date_2} = \"2020-02-02\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!((({number1} = 2) || ({double1} != 1.0)) && !({date_1} = \"2020-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("((({number1} != {number_1}) && ({double1} = 1.0)) && (({date_1} = \"2020-01-01\") || ({date_2} != ${date_1})))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!(({number1} = 1) && (({double2} != 2.0) || ({date_1} != \"2020-01-01\")))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(({number1} = 1) && (({double2} = 2.0) && ({date_1} = \"2020-01-01\"))) || ({number2} != 1)", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{null} = {null}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{bool_true} = {bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{array_of_numbers} = {array_of_numbers}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{null} != {null}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{bool_true} != {bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{array_of_numbers} != {array_of_numbers}", referenceExtractor));
    }

    @Test
    void evaluateHandlesGreaterAndLesserComparisonsWithReferenceValues() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number2} > {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} > {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} > 0.5", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} > {double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} < 10", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} < 0.5", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} < 2.0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} < {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} >= 1", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} >= 1.0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} >= 2.0", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} >= 0", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} <= 1", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} <= 0", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${double1} <= 1.0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} <= 0.5", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} > 0) && (${double1} <= 1.0)", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} < 0) || (${double1} >= 2.0)", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} >= 1) && ((${double1} > 0.5) || ({date_1} < \"2021-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} <= 0) && ((${double1} < 1.0) || ({date_1} >= \"2021-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(((${number1} > 0) && (${double2} < 3.0)) || ({date_1} <= ${date_1}))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(((${number1} < 0) || (${double1} >= 2.0)) && ({date_2} > \"2022-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(({number1} >= 1) && (({double1} < 2.0) || ({double2} > 1.5)) && ({date_1} <= \"2020-01-01\"))", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((({number1} < -1) || ({double2} >= 3.0)) && ({date_2} > ${date_1}))", referenceExtractor));
    }

    @Test
    void evaluateHandlesIsNullAndNotNullWithReferenceValues() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${null} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_objects} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${null} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${array_of_objects} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c06%} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c05%} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c13%} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${null} IsNull && ${number1} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} IsNull && ${number1} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${number1} NotNull && ${null} IsNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${null} IsNull || ${number1} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("!( ${number1} IsNull )", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!( ${null} IsNull )", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!( ${null} IsNull || ${number1} IsNull ) && ${number1} NotNull", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} NotNull || ${number2} NotNull) && (${null} IsNull || ${name} NotNull)", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} NotNull && ${number2} NotNull) || !( ${null} IsNull )", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("(${number1} NotNull && ${null} IsNull) || !( ${array_of_numbers} IsNull )", referenceExtractor));
    }

    @Test
    void evaluateHandlesIsEmptyAndNotEmptyOnCollections() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_numbers} IsEmpty", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_strings} IsEmpty", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_bool} IsEmpty", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${array_of_numbers} NotEmpty", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${array_of_strings} NotEmpty", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${array_of_bool} NotEmpty", referenceExtractor));
    }

    @Test
    void evaluateHandlesLikeAndNotLikeOnStrings() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{phone} Like \"%1%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("${name} Like \"%o%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{url} Like \"%google%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{phone} NotLike \"%1%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${name} NotLike \"%o%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{url} NotLike \"%google%\"", referenceExtractor));
    }

    @Test
    void evaluateResolvesInnerReferencesCorrectly() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"AAA{%#ffffff.(request).name%}AAA\" Like \"%{%#ffffff.(request).name%}%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"{%#ffffff.(request).name%}{%#ffffff.(request).name%}\" = \"Bob{%#ffffff.(request).name%}\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"{%#ffffff.(request).name%}{%#ffffff.(request).name%}\" = \"BobBob\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"AAA{%#ffffff.(response).array_of_numbers%}AAA\" Like \"%1, 2, 3, 4, 5%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("\"AAA{%#ffffff.(request).object%}AAA\" Like \"%\"id\": 1, \"name\": \"A\"%\"", referenceExtractor));
    }

    @Test
    void evaluateSerializesObjectsCorrectly() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE,
                expressionProcessor.evaluate("\"SS{%#ffffff.(request).object%}\" = \"SS{\"id\": 1, \"name\": \"A\"}\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,
                expressionProcessor.evaluate("\"PREFIX-{%#ffffff.(request).object%}-SUFFIX\" Like \"%\"id\": 1, \"name\": \"A\"%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,
                expressionProcessor.evaluate("\"A{%#ffffff.(request).array_of_objects%}\" = \"A[{\"id\": 1, \"name\": \"Bob\"}]\"", referenceExtractor));

        var nested = new LinkedHashMap<String, Object>();
        nested.put("id", 10);
        nested.put("meta", new LinkedHashMap<String, Object>() {{
            put("name", "X");
            put("active", true);
        }});
        nested.put("tags", List.of("a", "b"));
        referenceValues.put("{%#ffffff.(request).nested_object%}", nested);

        Assertions.assertEquals(Boolean.TRUE,
                expressionProcessor.evaluate("\"A{%#ffffff.(request).nested_object%}\" = \"A{\"id\": 10, \"meta\": {\"name\": \"X\", \"active\": true}, \"tags\": [\"a\", \"b\"]}\"", referenceExtractor));
    }

    @Test
    void evaluateShortCircuitsLogicalExpressions() throws InvalidExpressionException {
        Assertions.assertThrows(InvalidExpressionException.class, () -> expressionProcessor.evaluate("{%#ffffff.(request).body.$.person.email%} Like '%@%'", referenceExtractor));
        Assertions.assertDoesNotThrow(() -> expressionProcessor.evaluate("{%#ffffff.(request).body.$.person%} PropertyExists 'email' && {%#ffffff.(request).body.$.person.email%} Like '%@%'", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{%#ffffff.(request).body.$.person%} PropertyExists 'email' && {%#ffffff.(request).body.$.person.email%} Like '%@%'", referenceExtractor));
        Assertions.assertDoesNotThrow(() -> expressionProcessor.evaluate("{%#ffffff.(request).body.$.person%} PropertyExists 'address' && {%#ffffff.(request).body.$.person%} PropertyNotExists 'email' || {%#ffffff.(request).body.$.person.email%} Like '%@%'", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{%#ffffff.(request).body.$.person%} PropertyExists 'address' && {%#ffffff.(request).body.$.person%} PropertyNotExists 'email' || {%#ffffff.(request).body.$.person.email%} Like '%@%'", referenceExtractor));
        Assertions.assertThrows(InvalidExpressionException.class, () -> expressionProcessor.evaluate("{null} > 0", referenceExtractor));
        Assertions.assertDoesNotThrow(() -> expressionProcessor.evaluate("{bool_false} && {null} > 0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{bool_false} && {null} > 0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, validator.isValid("{bool_false} && 'a' > 0"));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{bool_false} && 'a' > 0", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE,  expressionProcessor.evaluate("{bool_true} || 'a' > 0", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("({bool_true} || {null} > 0) && {bool_false}", referenceExtractor));
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private void assertThrowsInvalidExpression(String expression) {
        Assertions.assertThrows(InvalidExpressionException.class, () ->
                expressionProcessor.evaluate(expression));
    }
}
