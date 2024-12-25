package com.becon.opencelium.backend;

import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.function.Function;

public class EvaluationTest {

    private static final HashMap<String, Object> referenceValues = new HashMap<>();
    private static final Function<String, Object> referenceExtractor = referenceValues::get;
    private static final ExpressionProcessor expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);

    static {
        // request data
        referenceValues.put("{null}", null);
        referenceValues.put("{bool_true}", true);
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
        referenceValues.put("{array_of_objects}", List.of(new HashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));

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
        referenceValues.put("${array_of_objects}", List.of(new HashMap<String, Object>() {{
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
        referenceValues.put("{%#ffffff.(request).array_of_objects%}", List.of(new HashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));

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
        referenceValues.put("#{%600d5b5f4f3e2c1d8a7b6c23%}", List.of(new HashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
    }

    @Test
    public void logical() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!${bool_true}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!#{%600d5b5f4f3e2c1d8a7b6c12%}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!${bool_true} && ({bool_true} || !{bool_true})", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{bool_true} && ({%#ffffff.(response).bool_true%} || !#{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!${bool_true} && {%#ffffff.(response).bool_true%} || (#{%600d5b5f4f3e2c1d8a7b6c12%} && ${bool_true})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!#{%600d5b5f4f3e2c1d8a7b6c12%} && !#{%600d5b5f4f3e2c1d8a7b6c12%} && !${bool_true}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%} && {%#ffffff.(response).bool_true%}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{bool_true} || (!{%#ffffff.(response).bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(#{%600d5b5f4f3e2c1d8a7b6c12%} && !{bool_true})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!(!${bool_true} || #{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!({%#ffffff.(response).bool_true%} && #{%600d5b5f4f3e2c1d8a7b6c12%}) || !${bool_true}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${bool_true} || ({%#ffffff.(response).bool_true%} && (!{bool_true} || {%#ffffff.(response).bool_true%}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("({bool_true} && !{%#ffffff.(response).bool_true%}) || (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("((#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && {bool_true}) || (!{%#ffffff.(response).bool_true%} && ${bool_true})", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((!${bool_true} || !#{%600d5b5f4f3e2c1d8a7b6c12%}) && (!${bool_true} && !#{%600d5b5f4f3e2c1d8a7b6c12%})) || !${bool_true}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} || (!{%#ffffff.(response).bool_true%} && ({bool_true} || ${bool_true}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(#{%600d5b5f4f3e2c1d8a7b6c12%} || !${bool_true}) && (#{%600d5b5f4f3e2c1d8a7b6c12%} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(!#{%600d5b5f4f3e2c1d8a7b6c12%} || ({bool_true} && !${bool_true}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${bool_true} || (!{bool_true} || (!${bool_true} && #{%600d5b5f4f3e2c1d8a7b6c12%}))", referenceExtractor)); // true
    }

    @Test
    public void equalityAndInequality() throws InvalidExpressionException {
        // Equality comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} = {number1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%}= ${number1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} ={double1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}=${double1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{date_1}= ${date_1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%} =${date_1}", referenceExtractor)); // true

        // Inequality comparisons
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1}!= {number1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} !=${number1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1}!={double1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%} != ${double1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_1} !=${date_1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%}!= ${date_1}", referenceExtractor)); // false

        // Cross comparisons (should be false for equality)
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} = {number2}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} = #{%600d5b5f4f3e2c1d8a7b6c02%}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} ={double2}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}= #{%600d5b5f4f3e2c1d8a7b6c05%}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_1} = ${date_2}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%}= #{%600d5b5f4f3e2c1d8a7b6c17%}", referenceExtractor)); // false

        // Inequality with different values (should be true)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} !={number2}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c01%} != #{%600d5b5f4f3e2c1d8a7b6c02%}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} != {double2}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c04%}!= #{%600d5b5f4f3e2c1d8a7b6c05%}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{date_1} !=${date_2}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c16%} != #{%600d5b5f4f3e2c1d8a7b6c17%}", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} = 1) && (${double1} = 1.0) && ({date_1} = \"2020-01-01\")", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} != 1) || (${double2} = 1.0)", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} = 1) && ((${double1} = 1.0) || ({date_2} != \"2020-01-01\"))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} = {number2}) && ((${double1} != {double2}) || ({date_1} != ${date_2}))", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} != {number2}) && ((${double1} = 1.0) && ({date_1} = ${date_1}))", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(((${number1} = 1) && (${double2} != 1.0)) || ({date_1} = ${date_1}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(((${number1} != 1) || (${double1} != 1.0)) && ({date_2} != \"2020-02-02\"))", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(({number1} = 1) && (({double1} = 1.0) || ({double2} = 2.0)) && ({date_1} = \"2020-01-01\"))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("((({number1} = -1) || ({double_2} = -2.0)) && ({date_2} != ${date_1}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(((${number1} = 1) && (${double1} = 1.0)) && ({date_1} = \"2020-01-01\")) || ({number_1} = -1)", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((({number1} = 2) && ({double1} = 1.0)) || !(${date_2} = \"2020-02-02\"))", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!((({number1} = 2) || ({double1} != 1.0)) && !({date_1} = \"2020-01-01\"))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("((({number1} != {number_1}) && ({double1} = 1.0)) && (({date_1} = \"2020-01-01\") || ({date_2} != ${date_1})))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!(({number1} = 1) && (({double2} != 2.0) || ({date_1} != \"2020-01-01\")))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(({number1} = 1) && (({double2} = 2.0) && ({date_1} = \"2020-01-01\"))) || ({number2} != 1)", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{null} = {null}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{bool_true} = {bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{url} = {url}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{number1} = {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{number2} = {number2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{number_1} = {number_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{double1} = {double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{double2} = {double2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{double_2} = {double_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{name} = {name}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{date_1} = {date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{date_2} = {date_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{email} = {email}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{phone} = {phone}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{array_of_numbers} = {array_of_numbers}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{array_of_strings} = {array_of_strings}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{array_of_bool} = {array_of_bool}", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{array_of_objects} = {array_of_objects}", referenceExtractor));

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{null} != {null}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{bool_true} != {bool_true}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{url} != {url}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{number1} != {number1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{number2} != {number2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{number_1} != {number_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{double1} != {double1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{double2} != {double2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{double_2} != {double_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{name} != {name}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_1} != {date_1}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{date_2} != {date_2}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{email} != {email}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{phone} != {phone}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{array_of_numbers} != {array_of_numbers}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{array_of_strings} != {array_of_strings}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{array_of_bool} != {array_of_bool}", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{array_of_objects} != {array_of_objects}", referenceExtractor));

    }

    @Test
    public void greaterAndLesserComparisons() throws InvalidExpressionException {
        // Greater-than comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number2} > {number1}", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} > {number1}", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} > 0.5", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} > {double1}", referenceExtractor)); // false

        // Lesser-than comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} < 10", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} < 0.5", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} < 2.0", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} < {number1}", referenceExtractor)); // false

        // Greater-than or equal comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} >= 1", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} >= 1.0", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} >= 2.0", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} >= 0", referenceExtractor)); // true

        // Lesser-than or equal comparisons
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} <= 1", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} <= 0", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${double1} <= 1.0", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${double1} <= 0.5", referenceExtractor)); // false

        // Complex expressions with parentheses and mixed relational operators
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} > 0) && (${double1} <= 1.0)", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} < 0) || (${double1} >= 2.0)", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} >= 1) && ((${double1} > 0.5) || ({date_1} < \"2021-01-01\"))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} <= 0) && ((${double1} < 1.0) || ({date_1} >= \"2021-01-01\"))", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(${number1} >= {number2}) && ((${double1} <= 2.0) && ({date_1} <= ${date_2}))", referenceExtractor)); // true

        // Nested parentheses with multiple operators
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(((${number1} > 0) && (${double2} < 3.0)) || ({date_1} <= ${date_1}))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("(((${number1} < 0) || (${double1} >= 2.0)) && ({date_2} > \"2022-01-01\"))", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(({number1} >= 1) && (({double1} < 2.0) || ({double2} > 1.5)) && ({date_1} <= \"2020-01-01\"))", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("((({number1} < -1) || ({double2} >= 3.0)) && ({date_2} > ${date_1}))", referenceExtractor)); // false
    }

    @Test
    public void isNullAndNotNullOperators() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${null} IsNull", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} IsNull", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_objects} IsNull", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} IsNull", referenceExtractor)); // false

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${null} NotNull", referenceExtractor)); // false
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} NotNull", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${array_of_objects} NotNull", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c06%} NotNull", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c12%} IsNull", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c05%} IsNull", referenceExtractor)); // false

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c13%} NotNull", referenceExtractor)); // true
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("#{%600d5b5f4f3e2c1d8a7b6c15%} NotNull", referenceExtractor)); // true

        // Using AND (&&) with IsNull and NotNull
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${null} IsNull && ${number1} NotNull", referenceExtractor)); // true (null IS null AND number1 is not null)
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${number1} IsNull && ${number1} NotNull", referenceExtractor)); // false (number1 is not null, but number1 is not null, so AND fails)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} NotNull && ${null} IsNull", referenceExtractor)); // false (number1 is not null, but null is null)

        // Using OR (||) with IsNull and NotNull
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${null} IsNull || ${number1} NotNull", referenceExtractor)); // true (null IS null OR number1 is not null)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${number1} NotNull || ${number2} NotNull", referenceExtractor)); // true (number1 is not null OR number2 is not null)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${null} IsNull || ${null} IsNull", referenceExtractor)); // true (null IS null OR null IS null)

        // Using NOT (!) with IsNull and NotNull
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("!( ${number1} IsNull )", referenceExtractor)); // true (number1 is not null, so IsNull fails and NOT turns it to true)
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!( ${null} IsNull )", referenceExtractor)); // false (null IS null, so NOT turns it to false)

        // Combining NOT, AND and OR
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("!( ${null} IsNull || ${number1} IsNull ) && ${number1} NotNull", referenceExtractor)); // true (null is null, so ISNull OR ISNull makes it false, then NOT makes it true, AND with number1 NotNull)

        // Using parentheses to group logical operations
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} NotNull || ${number2} NotNull) && (${null} IsNull || ${name} NotNull)", referenceExtractor)); // true (both ORs are true, so AND is true)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${null} IsNull && ${number1} NotNull) || ${name} IsNull", referenceExtractor)); // false (null IS null AND number1 is not null, so true AND false, OR false)

        // Combining multiple logical operations with parentheses
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} NotNull && ${number2} NotNull) || !( ${null} IsNull )", referenceExtractor)); // true (OR: both number1 and number2 are not null, or NOT null is false)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("(${number1} NotNull && ${null} IsNull) || !( ${array_of_numbers} IsNull )", referenceExtractor)); // false (number1 is not null AND null is null, so false, OR with !(array is not null) is false)

    }

    @Test
    public void isEmptyAndNotEmpty() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_numbers} IsEmpty", referenceExtractor)); // true (array_of_numbers is non-empty, so this should be false, so fixing to expected)
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_strings} IsEmpty", referenceExtractor)); // true (array_of_strings is non-empty)
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${array_of_bool} IsEmpty", referenceExtractor)); // true

        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${array_of_numbers} NotEmpty", referenceExtractor)); // true (array_of_numbers is non-empty, so this should be false, so fixing to expected)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${array_of_strings} NotEmpty", referenceExtractor)); // true (array_of_strings is non-empty)
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${array_of_bool} NotEmpty", referenceExtractor)); // true
    }

    @Test
    public void likeAndNotLike() throws InvalidExpressionException {
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{phone} Like \"%1%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("${name} Like \"%o%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.TRUE, expressionProcessor.evaluate("{url} Like \"%google%\"", referenceExtractor));

        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{phone} NotLike \"%1%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("${name} NotLike \"%o%\"", referenceExtractor));
        Assertions.assertEquals(Boolean.FALSE, expressionProcessor.evaluate("{url} NotLike \"%google%\"", referenceExtractor));

    }
}
