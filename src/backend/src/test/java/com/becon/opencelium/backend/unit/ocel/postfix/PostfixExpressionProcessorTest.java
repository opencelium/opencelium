package com.becon.opencelium.backend.unit.ocel.postfix;

import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.ocel.postfix.PostfixExpressionProcessor;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.testutil.fake.FakeReferenceExtractor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link PostfixExpressionProcessor}.
 *
 * No Spring context is loaded — the processor is instantiated directly
 * and references are resolved by {@link FakeReferenceExtractor}.
 */
@DisplayName("PostfixExpressionProcessor — unit")
class PostfixExpressionProcessorTest {

    private static final ExpressionProcessor expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);

    private static final FakeReferenceExtractor referenceExtractor = new FakeReferenceExtractor();

    // ── logical / comparison / type operators (literal values) ───────────────

    @ParameterizedTest
    @MethodSource("logicalBooleanExpressions")
    void evaluateReturnsExpectedResultWhenExpressionIsLogicalBoolean(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(expected);
    }

    static Stream<Arguments> logicalBooleanExpressions() {
        return Stream.of(
                Arguments.of("true && false", false),
                Arguments.of("true", true),
                Arguments.of("false", false),
                Arguments.of("false && (true || false)", false),
                Arguments.of("true && (true || false)", true),
                Arguments.of("(false && true) || (true && true)", true),
                Arguments.of("false && false && false", false),
                Arguments.of("true && true && true", true),
                Arguments.of("true || (false && false)", true),
                Arguments.of("!(true && false)", true),
                Arguments.of("!(false || false)", true),
                Arguments.of("!(true && true) || false", false),
                Arguments.of("false || (true && (false || true))", true),
                Arguments.of("(true && false) || (false && false)", false),
                Arguments.of("((true || false) && true) || (false && true)", true),
                Arguments.of("((false || false) && (false && false)) || false", false),
                Arguments.of("true || (false && (true || false))", true),
                Arguments.of("(true || false) && (true || (false && false))", true),
                Arguments.of("!(false || (true && false))", true),
                Arguments.of("true || (false || (false && true))", true)
        );
    }

    @ParameterizedTest
    @MethodSource("comparisonWithLogicalOperatorExpressions")
    void evaluateReturnsExpectedResultWhenLogicalOperatorsCombineComparisons(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(expected);
    }

    static Stream<Arguments> comparisonWithLogicalOperatorExpressions() {
        return Stream.of(
                Arguments.of("1 < 2 && 3 != 4", true),
                Arguments.of("1 = 2 || 4 <= 6", true),
                Arguments.of("5 >= 10 && 8 < 3", false),
                Arguments.of("(3 > 2) && (5 = 5)", true),
                Arguments.of("(1 < 1) || (2 > 3)", false),
                Arguments.of("(4 <= 6) && (7 != 8)", true),
                Arguments.of("0 < 0 && (1 != 1 || 2 < 3)", false),
                Arguments.of("1 < 2 && (3 >= 3)", true),
                Arguments.of("(1 = 1) || (2 < 3)", true),
                Arguments.of("5 < 2 && 2 > 5", false),
                Arguments.of("3 > 2 && 10 >= 10", true),
                Arguments.of("4 = 4 || (5 > 6 && 7 != 8)", true),
                Arguments.of("!(1 < 2 && 3 != 3)", true),
                Arguments.of("!(2 >= 3 || 4 < 4)", true),
                Arguments.of("!(1 > 2) || (2 = 2)", true),
                Arguments.of("1 < 3 || (4 >= 6 && 7 != 7)", true),
                Arguments.of("(1 < 2 && 3 = 3) || (5 >= 5 && 4 < 2)", true),
                Arguments.of("((1 < 2) && (3 != 4)) || (4 > 3)", true),
                Arguments.of("((1 = 1) && (0 >= 1)) || false", false),
                Arguments.of("1 < 5 || (3 <= 3 && (2 > 1))", true),
                Arguments.of("(5 >= 2) && (3 < 4 || 1 > 0)", true),
                Arguments.of("!(0 < 1)", false),
                Arguments.of("2 > 1 || (0 <= 0 && 3 != 3)", true)
        );
    }

    @ParameterizedTest
    @MethodSource("dateAndNumberComparisonExpressions")
    void evaluateReturnsExpectedResultWhenLogicalOperatorsCombineDateAndNumber(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(expected);
    }

    static Stream<Arguments> dateAndNumberComparisonExpressions() {
        return Stream.of(
                Arguments.of("(\"2024-05-05\" < \"2025-01-01\" && \"2023-11-11\" <= \"2023-11-11\") || (\"2022-08-08\" > \"2022-01-01\")", true),
                Arguments.of("!(\"2023-12-31\" <= \"2024-01-01\") && (\"2025-06-01\" != \"2025-06-01\")", false),
                Arguments.of("(\"2024-03-15\" < \"2024-04-01\" || \"2023-03-15\" > \"2022-05-05\") && (\"2025-01-01\" >= \"2024-12-31\")", true),
                Arguments.of("!(\"2025-01-01\" < \"2025-12-31\" || (\"2022-06-15\" >= \"2022-06-16\")) && \"2023-01-01\" = \"2023-01-02\"", false),
                Arguments.of("(\"2023-05-10\" < \"2023-05-11\" || (\"2022-05-01\" >= \"2022-04-01\" && \"2024-11-01\" != \"2024-11-02\")) && \"2024-01-01\" < \"2024-12-01\"", true),
                Arguments.of("(\"2024-10-10\" > \"2023-10-09\" && 5 < 10) || (\"2025-01-01\" < \"2026-01-01\" && 20 > 15)", true),
                Arguments.of("(\"2024-12-31\" <= \"2024-12-30\" && 7 >= 10) || (\"2025-01-01\" > \"2026-01-01\" && 15 = 15)", false),
                Arguments.of("5 = 5 && (\"2023-01-01\" <= \"2023-12-31\" || 12 > 11) && \"2022-02-02\" != \"2023-02-02\"", true),
                Arguments.of("!(\"2023-06-01\" >= \"2023-06-01\" && 8 > 9) || (\"2024-01-01\" < \"2024-01-01\" && 2 = 2)", true),
                Arguments.of("(\"2022-01-01\" < \"2023-01-01\" && 50 >= 25) || (10 <= 20 && \"2025-12-31\" > \"2024-12-31\")", true)
        );
    }

    @ParameterizedTest
    @MethodSource("typeAndNullCheckExpressions")
    void evaluateReturnsExpectedResultWhenLogicalOperatorsCombineTypeAndNullChecks(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(expected);
    }

    static Stream<Arguments> typeAndNullCheckExpressions() {
        return Stream.of(
                Arguments.of("\"text\" IsTypeOf STR && 5 IsTypeOf NUM", true),
                Arguments.of("[1, 2, 3] IsTypeOf ARR && \"value\" NotNull", true),
                Arguments.of("null IsTypeOf OBJ || 123 IsTypeOf STR", true),
                Arguments.of("true IsTypeOf BOOL && false IsTypeOf BOOL", true),
                Arguments.of("5 IsTypeOf BOOL || \"test\" IsTypeOf NUM", false),
                Arguments.of("null IsNull && \"non-null\" NotNull", true),
                Arguments.of("5 IsNull || null NotNull", false),
                Arguments.of("null IsNull && null IsTypeOf OBJ", true),
                Arguments.of("[1, 2, 3] NotNull && [] IsEmpty", true),
                Arguments.of("null NotNull || [5] IsEmpty", false),
                Arguments.of("true IsTypeOf ARR || [1] IsEmpty", false),
                Arguments.of("[] IsEmpty && null IsNull", true),
                Arguments.of("[\"value\"] IsEmpty || \"non-empty\" IsNull", false),
                Arguments.of("5 NotNull && \"string\" NotNull && [] IsEmpty", true),
                Arguments.of("\"string\" IsTypeOf STR && null IsNull && 10 IsTypeOf NUM", true),
                Arguments.of("null IsNull && \"value\" IsTypeOf ARR", false),
                Arguments.of("5 IsTypeOf NUM && null IsNull && !([1, 2] IsEmpty)", true),
                Arguments.of("true IsTypeOf BOOL && !([1] IsEmpty) && \"test\" NotNull", true),
                Arguments.of("null NotNull || 100 IsTypeOf BOOL || [1, 2, 3] IsEmpty", false),
                Arguments.of("(\"test\" IsTypeOf STR && !([1,2,3] IsEmpty)) || null IsNull", true),
                Arguments.of("(!(null NotNull) && \"\" NotNull) || 3 IsTypeOf ARR", true),
                Arguments.of("5 IsTypeOf NUM && [1,2,3] NotNull && \"text\" NotNull", true),
                Arguments.of("(null IsNull && [] IsEmpty) || (true IsTypeOf BOOL && false IsTypeOf BOOL)", true),
                Arguments.of("null NotNull || \"string\" IsTypeOf ARR || [1] IsEmpty", false)
        );
    }

    @ParameterizedTest
    @MethodSource("invalidLiteralExpressions")
    void evaluateThrowsInvalidExpressionExceptionWhenExpressionIsInvalid(String expression) {
        assertThatThrownBy(() -> expressionProcessor.evaluate(expression))
                .isInstanceOf(InvalidExpressionException.class);
    }

    static Stream<String> invalidLiteralExpressions() {
        return Stream.of(
                "[wvdkws] IsEmpty",
                "A && B",
                "\"text\" && false",
                "\"unclosedString);",
                "5 > \"text\"",
                "[] && true",
                "[1, 2] || [\"a\", \"b\"]"
        );
    }

    // ── logical / comparison operators (reference values) ────────────────────

    @ParameterizedTest
    @MethodSource("logicalOperatorReferenceExpressions")
    void evaluateReturnsExpectedResultWhenLogicalOperatorsUseReferences(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> logicalOperatorReferenceExpressions() {
        return Stream.of(
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true}", false),
                Arguments.of("!${bool_true}", false),
                Arguments.of("!#{%600d5b5f4f3e2c1d8a7b6c12%}", false),
                Arguments.of("!${bool_true} && ({bool_true} || !{bool_true})", false),
                Arguments.of("{bool_true} && ({%#ffffff.(response).body.$.bool_true%} || !#{%600d5b5f4f3e2c1d8a7b6c12%})", true),
                Arguments.of("!${bool_true} && {%#ffffff.(response).body.$.bool_true%} || (#{%600d5b5f4f3e2c1d8a7b6c12%} && ${bool_true})", true),
                Arguments.of("!#{%600d5b5f4f3e2c1d8a7b6c12%} && !#{%600d5b5f4f3e2c1d8a7b6c12%} && !${bool_true}", false),
                Arguments.of("${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%} && {%#ffffff.(response).body.$.bool_true%}", true),
                Arguments.of("{bool_true} || (!{%#ffffff.(response).body.$.bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%})", true),
                Arguments.of("!(#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true})", true),
                Arguments.of("!(!${bool_true} || #{%600d5b5f4f3e2c1d8a7b6c12%})", false),
                Arguments.of("!({%#ffffff.(response).body.$.bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%}) || !${bool_true}", false),
                Arguments.of("${bool_true} || ({%#ffffff.(response).body.$.bool_true%} && (!{bool_true} || {%#ffffff.(response).body.$.bool_true%}))", true),
                Arguments.of("({bool_true} && !{%#ffffff.(response).body.$.bool_true%}) || (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})", false),
                Arguments.of("((#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && {bool_true}) || (!{%#ffffff.(response).body.$.bool_true%} && ${bool_true})", true),
                Arguments.of("((!${bool_true} || !#{%600d5b5f4f3e2c1d8a7b6c12%}) && (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})) || !${bool_true}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c12%} || (!{%#ffffff.(response).body.$.bool_true%} && ({bool_true} || ${bool_true}))", true),
                Arguments.of("(#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && (#{%600d5b5f4f3e2c1d8a7b6c12%} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", true),
                Arguments.of("!(!#{%600d5b5f4f3e2c1d8a7b6c12%} || ({bool_true} && !${bool_true}))", true),
                Arguments.of("${bool_true} || (!{bool_true} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", true)
        );
    }

    @ParameterizedTest
    @MethodSource("equalityAndInequalityReferenceExpressions")
    void evaluateReturnsExpectedResultWhenEqualityCheckUsesReferences(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> equalityAndInequalityReferenceExpressions() {
        return Stream.of(
                Arguments.of("${number1} = {number1}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c01%}= ${number1}", true),
                Arguments.of("${double1} ={double1}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c04%}=${double1}", true),
                Arguments.of("{date_1}= ${date_1}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c16%} =${date_1}", true),
                Arguments.of("${number1}!= {number1}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c01%} !=${number1}", false),
                Arguments.of("${double1}!={double1}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c04%} != ${double1}", false),
                Arguments.of("{date_1} !=${date_1}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c16%}!= ${date_1}", false),
                Arguments.of("${number1} = {number2}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c01%} = #{%600d5b5f4f3e2c1d8a7b6c02%}", false),
                Arguments.of("${double1} ={double2}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c04%}= #{%600d5b5f4f3e2c1d8a7b6c05%}", false),
                Arguments.of("{date_1} = ${date_2}", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c16%}= #{%600d5b5f4f3e2c1d8a7b6c17%}", false),
                Arguments.of("${number1} !={number2}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c01%} != #{%600d5b5f4f3e2c1d8a7b6c02%}", true),
                Arguments.of("${double1} != {double2}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c04%}!= #{%600d5b5f4f3e2c1d8a7b6c05%}", true),
                Arguments.of("{date_1} !=${date_2}", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c16%} != #{%600d5b5f4f3e2c1d8a7b6c17%}", true),
                Arguments.of("(${number1} = 1) && (${double1} = 1.0) && ({date_1} = \"2020-01-01\")", true),
                Arguments.of("(${number1} != 1) || (${double2} = 1.0)", false),
                Arguments.of("(${number1} = 1) && ((${double1} = 1.0) || ({date_2} != \"2020-01-01\"))", true),
                Arguments.of("(${number1} = {number2}) && ((${double1} != {double2}) || ({date_1} != ${date_2}))", false),
                Arguments.of("(${number1} != {number2}) && ((${double1} = 1.0) && ({date_1} = ${date_1}))", true),
                Arguments.of("(((${number1} = 1) && (${double2} != 1.0)) || ({date_1} = ${date_1}))", true),
                Arguments.of("(((${number1} != 1) || (${double1} != 1.0)) && ({date_2} != \"2020-02-02\"))", false),
                Arguments.of("(({number1} = 1) && (({double1} = 1.0) || ({double2} = 2.0)) && ({date_1} = \"2020-01-01\"))", true),
                Arguments.of("((({number1} = -1) || ({double_2} = -2.0)) && ({date_2} != ${date_1}))", true),
                Arguments.of("(((${number1} = 1) && (${double1} = 1.0)) && ({date_1} = \"2020-01-01\")) || ({number_1} = -1)", true),
                Arguments.of("((({number1} = 2) && ({double1} = 1.0)) || !(${date_2} = \"2020-02-02\"))", false),
                Arguments.of("!((({number1} = 2) || ({double1} != 1.0)) && !({date_1} = \"2020-01-01\"))", true),
                Arguments.of("((({number1} != {number_1}) && ({double1} = 1.0)) && (({date_1} = \"2020-01-01\") || ({date_2} != ${date_1})))", true),
                Arguments.of("!(({number1} = 1) && (({double2} != 2.0) || ({date_1} != \"2020-01-01\")))", true),
                Arguments.of("(({number1} = 1) && (({double2} = 2.0) && ({date_1} = \"2020-01-01\"))) || ({number2} != 1)", true),
                Arguments.of("{null} = {null}", true),
                Arguments.of("{bool_true} = {bool_true}", true),
                Arguments.of("{array_of_numbers} = {array_of_numbers}", true),
                Arguments.of("{null} != {null}", false),
                Arguments.of("{bool_true} != {bool_true}", false),
                Arguments.of("{array_of_numbers} != {array_of_numbers}", false)
        );
    }

    @ParameterizedTest
    @MethodSource("greaterAndLesserReferenceExpressions")
    void evaluateReturnsExpectedResultWhenOrderingComparisonUsesReferences(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> greaterAndLesserReferenceExpressions() {
        return Stream.of(
                Arguments.of("${number2} > {number1}", true),
                Arguments.of("${number1} > {number1}", false),
                Arguments.of("${double1} > 0.5", true),
                Arguments.of("${double1} > {double1}", false),
                Arguments.of("${number1} < 10", true),
                Arguments.of("${double1} < 0.5", false),
                Arguments.of("${double1} < 2.0", true),
                Arguments.of("${number1} < {number1}", false),
                Arguments.of("${number1} >= 1", true),
                Arguments.of("${double1} >= 1.0", true),
                Arguments.of("${double1} >= 2.0", false),
                Arguments.of("${number1} >= 0", true),
                Arguments.of("${number1} <= 1", true),
                Arguments.of("${number1} <= 0", false),
                Arguments.of("${double1} <= 1.0", true),
                Arguments.of("${double1} <= 0.5", false),
                Arguments.of("(${number1} > 0) && (${double1} <= 1.0)", true),
                Arguments.of("(${number1} < 0) || (${double1} >= 2.0)", false),
                Arguments.of("(${number1} >= 1) && ((${double1} > 0.5) || ({date_1} < \"2021-01-01\"))", true),
                Arguments.of("(${number1} <= 0) && ((${double1} < 1.0) || ({date_1} >= \"2021-01-01\"))", false),
                Arguments.of("(((${number1} > 0) && (${double2} < 3.0)) || ({date_1} <= ${date_1}))", true),
                Arguments.of("(((${number1} < 0) || (${double1} >= 2.0)) && ({date_2} > \"2022-01-01\"))", false),
                Arguments.of("(({number1} >= 1) && (({double1} < 2.0) || ({double2} > 1.5)) && ({date_1} <= \"2020-01-01\"))", true),
                Arguments.of("((({number1} < -1) || ({double2} >= 3.0)) && ({date_2} > ${date_1}))", false)
        );
    }

    @ParameterizedTest
    @MethodSource("isNullAndNotNullReferenceExpressions")
    void evaluateReturnsExpectedResultWhenNullCheckUsesReferences(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> isNullAndNotNullReferenceExpressions() {
        return Stream.of(
                Arguments.of("${null} IsNull", true),
                Arguments.of("${number1} IsNull", false),
                Arguments.of("${array_of_objects} IsNull", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c12%} IsNull", false),
                Arguments.of("${null} NotNull", false),
                Arguments.of("${number1} NotNull", true),
                Arguments.of("${array_of_objects} NotNull", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c06%} NotNull", true),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c05%} IsNull", false),
                Arguments.of("#{%600d5b5f4f3e2c1d8a7b6c13%} NotNull", true),
                Arguments.of("${null} IsNull && ${number1} NotNull", true),
                Arguments.of("${number1} IsNull && ${number1} NotNull", false),
                Arguments.of("${number1} NotNull && ${null} IsNull", true),
                Arguments.of("${null} IsNull || ${number1} NotNull", true),
                Arguments.of("!( ${number1} IsNull )", true),
                Arguments.of("!( ${null} IsNull )", false),
                Arguments.of("!( ${null} IsNull || ${number1} IsNull ) && ${number1} NotNull", false),
                Arguments.of("(${number1} NotNull || ${number2} NotNull) && (${null} IsNull || ${name} NotNull)", true),
                Arguments.of("(${number1} NotNull && ${number2} NotNull) || !( ${null} IsNull )", true),
                Arguments.of("(${number1} NotNull && ${null} IsNull) || !( ${array_of_numbers} IsNull )", true)
        );
    }

    @ParameterizedTest
    @MethodSource("isEmptyAndNotEmptyExpressions")
    void evaluateReturnsExpectedResultWhenEmptyCheckTargetsCollection(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> isEmptyAndNotEmptyExpressions() {
        return Stream.of(
                Arguments.of("${array_of_numbers} IsEmpty", false),
                Arguments.of("${array_of_strings} IsEmpty", false),
                Arguments.of("${array_of_bool} IsEmpty", false),
                Arguments.of("${array_of_numbers} NotEmpty", true),
                Arguments.of("${array_of_strings} NotEmpty", true),
                Arguments.of("${array_of_bool} NotEmpty", true)
        );
    }

    @ParameterizedTest
    @MethodSource("likeAndNotLikeExpressions")
    void evaluateReturnsExpectedResultWhenLikeOperatorTargetsString(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> likeAndNotLikeExpressions() {
        return Stream.of(
                Arguments.of("{phone} Like \"%1%\"", true),
                Arguments.of("${name} Like \"%A%\"", true),
                Arguments.of("{url} Like \"%google%\"", true),
                Arguments.of("{phone} NotLike \"%1%\"", false),
                Arguments.of("${name} NotLike \"%A%\"", false),
                Arguments.of("{url} NotLike \"%google%\"", false)
        );
    }

    @ParameterizedTest
    @MethodSource("innerReferenceExpressions")
    void evaluateResolvesInnerReferencesWhenExpressionContainsThem(String expression) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(Boolean.TRUE);
    }

    static Stream<String> innerReferenceExpressions() {
        return Stream.of(
                "\"AAA{%#ffffff.(request).body.$.name%}AAA\" Like \"%{%#ffffff.(request).body.$.name%}%\"",
                "\"{%#ffffff.(request).body.$.name%}{%#ffffff.(request).body.$.name%}\" = \"A{%#ffffff.(request).body.$.name%}\"",
                "\"{%#ffffff.(request).body.$.name%}{%#ffffff.(request).body.$.name%}\" = \"AA\"",
                "\"AAA{%#ffffff.(response).body.$.array_of_numbers%}AAA\" Like \"%1, 2, 3, 4, 5%\"",
                "\"AAA{%#ffffff.(request).body.$.object%}AAA\" Like \"%\"id\": 1, \"name\": \"A\"%\""
        );
    }

    @Test
    void evaluateSerializesObjectsWhenResultIsComplex() throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate("\"SS{%#ffffff.(request).body.$.object%}\" = \"SS{\"id\": 1, \"name\": \"A\"}\"", referenceExtractor::getValue)).isEqualTo(Boolean.TRUE);
        assertThat(expressionProcessor.evaluate("\"PREFIX-{%#ffffff.(request).body.$.object%}-SUFFIX\" Like \"%\"id\": 1, \"name\": \"A\"%\"", referenceExtractor::getValue)).isEqualTo(Boolean.TRUE);
        assertThat(expressionProcessor.evaluate("\"A{%#ffffff.(request).body.$.array_of_objects%}\" = \"A[{\"id\": 1, \"name\": \"A\"}]\"", referenceExtractor::getValue)).isEqualTo(Boolean.TRUE);
        assertThat(expressionProcessor.evaluate("\"A{%#ffffff.(request).body.$.nested_object%}\" = \"A{\"id\": 10, \"meta\": {\"name\": \"X\", \"active\": true}, \"tags\": [\"a\", \"b\"]}\"", referenceExtractor::getValue)).isEqualTo(Boolean.TRUE);
    }


    // ── current_date / current_date_time / current_time_mills / date_parse ─────

    @Test
    void evaluateReturnsFormattedDateWhenCurrentDateFunctionUsesTimezone() throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate("current_date(\"America/New_York\")"))
                .isEqualTo(LocalDate.now(ZoneId.of("America/New_York")).toString());
        assertThat(expressionProcessor.evaluate("current_date(\"+02:00\")"))
                .isEqualTo(LocalDate.now(ZoneOffset.of("+02:00")).toString());
    }

    @ParameterizedTest
    @MethodSource("currentDateComparisonExpressions")
    void evaluateReturnsExpectedResultWhenCurrentDateIsCompared(String expression) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(Boolean.TRUE);
    }

    static Stream<String> currentDateComparisonExpressions() {
        return Stream.of(
                "current_date() = current_date(\"UTC\")",
                "current_date() > \"2012-12-12\"",
                "current_date() < \"2032-12-12\""
        );
    }

    @ParameterizedTest
    @MethodSource("currentDateTimeComparisonExpressions")
    void evaluateReturnsExpectedResultWhenCurrentDateTimeIsCompared(String expression) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(Boolean.TRUE);
    }

    static Stream<String> currentDateTimeComparisonExpressions() {
        return Stream.of(
                "current_date_time() > \"2012-12-12T12:12:12\"",
                "current_date_time() < \"2032-12-12T12:12:12\""
        );
    }

    @ParameterizedTest
    @MethodSource("currentTimeMillsComparisonExpressions")
    void evaluateReturnsExpectedResultWhenCurrentTimeMillsIsCompared(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(expected);
    }

    static Stream<Arguments> currentTimeMillsComparisonExpressions() {
        return Stream.of(
                Arguments.of("current_time_mills() <= current_time_mills()", true),
                Arguments.of("current_time_mills() > current_time_mills()", false),
                Arguments.of("current_time_mills() > 1141242141254", true)
        );
    }

    @ParameterizedTest
    @MethodSource("dateParsedComparisonExpressions")
    void evaluateReturnsExpectedResultWhenDateParseHandlesMultipleFormats(String expression) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression)).isEqualTo(Boolean.TRUE);
    }

    static Stream<String> dateParsedComparisonExpressions() {
        return Stream.of(
                "date_parse(\"2024/12/22\",\"yyyy/MM/dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")",
                "date_parse(\"12-21-2000\",\"MM-dd-yyyy\") < date_parse(\"2024/11/22\", \"yyyy/MM/dd\")",
                "date_parse(current_date(),\"yyyy-MM-dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")"
        );
    }

    // ── short-circuit evaluation ──────────────────────────────────────────────

    @ParameterizedTest
    @MethodSource("throwingShortCircuitExpressions")
    void evaluateThrowsWhenShortCircuitDoesNotGuardInvalidBranch(String expression) {
        assertThatThrownBy(() -> expressionProcessor.evaluate(expression, referenceExtractor::getValue))
                .isInstanceOf(InvalidExpressionException.class);
    }

    static Stream<String> throwingShortCircuitExpressions() {
        return Stream.of(
                "{%#ffffff.(request).body.$.person.email%} Like '%@%'",
                "{null} > 0"
        );
    }

    @ParameterizedTest
    @MethodSource("nonThrowingShortCircuitExpressions")
    void evaluateDoesNotThrowWhenShortCircuitProtectsInvalidExpression(String expression) {
        assertThatCode(() -> expressionProcessor.evaluate(expression, referenceExtractor::getValue))
                .doesNotThrowAnyException();
    }

    static Stream<String> nonThrowingShortCircuitExpressions() {
        return Stream.of(
                "{%#ffffff.(request).body.$.person%} PropertyExists 'email' && {%#ffffff.(request).body.$.person.email%} Like '%@%'",
                "{%#ffffff.(request).body.$.person%} PropertyExists 'address' && {%#ffffff.(request).body.$.person%} PropertyNotExists 'email' || {%#ffffff.(request).body.$.person.email%} Like '%@%'",
                "{bool_false} && {null} > 0"
        );
    }

    @ParameterizedTest
    @MethodSource("shortCircuitReturnValueExpressions")
    void evaluateReturnsExpectedValueWhenShortCircuitApplies(String expression, boolean expected) throws InvalidExpressionException {
        assertThat(expressionProcessor.evaluate(expression, referenceExtractor::getValue)).isEqualTo(expected);
    }

    static Stream<Arguments> shortCircuitReturnValueExpressions() {
        return Stream.of(
                Arguments.of("{%#ffffff.(request).body.$.person%} PropertyExists 'email' && {%#ffffff.(request).body.$.person.email%} Like '%@%'", false),
                Arguments.of("{%#ffffff.(request).body.$.person%} PropertyExists 'address' && {%#ffffff.(request).body.$.person%} PropertyNotExists 'email' || {%#ffffff.(request).body.$.person.email%} Like '%@%'", true),
                Arguments.of("{bool_false} && {null} > 0", false),
                Arguments.of("{bool_false} && 'a' > 0", false),
                Arguments.of("{bool_true} || 'a' > 0", true),
                Arguments.of("({bool_true} || {null} > 0) && {bool_false}", false)
        );
    }
}
