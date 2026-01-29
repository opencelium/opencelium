package com.becon.opencelium.backend.reference;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReferenceDetectorTest {
    /*
     * Test-only delegate for ReferenceDetector.containsReference(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static boolean detected(String expression) {
        return ReferenceDetector.containsReference(expression);
    }


    // -------  POSITIVE cases: exact match  -------

    @ParameterizedTest
    @CsvSource({
            "#ababab.(response).[*]",
            "#aba213.(response).[*].status",
            "#123bab.(response).[*].header",
            "#aba312.(response).[*].body",
            "#ab123b.(response).status",
            "#a4346b.(response).header.$.Content-Type",
            "#a543ab.(request).header.$.Content-Type",
            "#a43bab.(response).body.$.field[*]",
            "#ab634b.(request).body.$.field[*]",
            "#346bab.(response).body.$.field1.['field2_with_special_symbol'].field3",
            "#456536.(response).body.$.[*]",
            "#a5464b.(request).body.$.[*]"
    })
    void detectExactDirectRef(String directRef) {
        assertTrue(detected(directRef));
    }

    @ParameterizedTest
    @CsvSource({
            "{%#ababab.(response).[*]%}",
            "{%#aba213.(response).[*].status%}",
            "{%#123bab.(response).[*].header%}",
            "{%#aba312.(response).[*].body%}",
            "{%#ab123b.(response).status%}",
            "{%#a4346b.(response).header.$.Content-Type%}",
            "{%#a543ab.(request).header.$.Content-Type%}",
            "{%#a43bab.(response).body.$.field[*]%}",
            "{%#ab634b.(request).body.$.field[*]%}",
            "{%#346bab.(response).body.$.field1.['field2_with_special_symbol'].field3%}",
            "{%#456536.(response).body.$.[*]%}",
            "{%#a5464b.(request).body.$.[*]%}"
    })
    void detectExactWrappedDirectRef(String wrappedDirectRef) {
        assertTrue(detected(wrappedDirectRef));
    }

    @Test
    void detectExactEnhancement() {
        String enhancement = "#{%ABCDEF0123456789ABCDEF01%}";
        assertTrue(detected(enhancement));
    }

    @ParameterizedTest
    @CsvSource({
            "${key}",
            "${key:type}",
            "${key.field[*]}",
            "${key.field[*]:type}"
    })
    void detectExactWebhook(String webhook) {
        assertTrue(detected(webhook));
    }

    @Test
    void detectExactPageRef() {
        String pageRef = "@{limit}";
        assertTrue(detected(pageRef));
    }

    @ParameterizedTest
    @CsvSource({
            "{key}",
            "{#12.key}"
    })
    void detectExactRequestData(String requestData) {
        assertTrue(detected(requestData));
    }

    // -------  POSITIVE cases: contained references  -------

    @ParameterizedTest
    @CsvSource({
            "#ababab.(response).[*]",
            "#aba213.(response).[*].status",
            "#123bab.(response).[*].header",
            "#aba312.(response).[*].body",
            "#ab123b.(response).status",
            "#a4346b.(response).header.$.Content-Type",
            "#a543ab.(request).header.$.Content-Type",
            "#a43bab.(response).body.$.field[*]",
            "#ab634b.(request).body.$.field[*]",
            "#346bab.(response).body.$.field1.['field2_with_special_symbol'].field3",
            "#456536.(response).body.$.[*]",
            "#a5464b.(request).body.$.[*]"
    })
    void detectContainedDirectRef(String directRef) {
        String value = "prefix " + directRef + " suffix";
        assertTrue(detected(value));
    }

    @ParameterizedTest
    @CsvSource({
            "{%#ababab.(response).[*]%}",
            "{%#aba213.(response).[*].status%}",
            "{%#123bab.(response).[*].header%}",
            "{%#aba312.(response).[*].body%}",
            "{%#ab123b.(response).status%}",
            "{%#a4346b.(response).header.$.Content-Type%}",
            "{%#a543ab.(request).header.$.Content-Type%}",
            "{%#a43bab.(response).body.$.field[*]%}",
            "{%#ab634b.(request).body.$.field[*]%}",
            "{%#346bab.(response).body.$.field1.['field2_with_special_symbol'].field3%}",
            "{%#456536.(response).body.$.[*]%}",
            "{%#a5464b.(request).body.$.[*]%}"
    })
    void detectContainedWrappedDirectRef(String wrappedDirectRef) {
        String value = "value = " + wrappedDirectRef;
        assertTrue(detected(value));
    }

    @Test
    void detectContainedEnhancement() {
        String value = "prefix #{%ABCDEF0123456789ABCDEF01%} suffix";
        assertTrue(detected(value));
    }

    @ParameterizedTest
    @CsvSource({
            "${key}",
            "${key:type}",
            "${key.field[*]}",
            "${key.field[*]:type}"
    })
    void detectContainedWebhook(String webhook) {
        String value = "prefix " + webhook + " suffix";
        assertTrue(detected(value));
    }

    @Test
    void detectContainedPageRef() {
        String value = "page size is @{size} and limit is @{limit}";
        assertTrue(detected(value));
    }

    @ParameterizedTest
    @CsvSource({
            "{key}",
            "{#12.key}"
    })
    void detectContainedRequestData(String requestData) {
        String value = "request value = " + requestData;
        assertTrue(detected(value));
    }


    // -------  NEGATIVE cases  -------

    @Test
    void returnFalseForNull() {
        assertFalse(detected(null));
    }

    @ParameterizedTest
    @CsvSource({
            "long plain text with no special reference syntax at all",
            "1234567890 this is a long numeric looking string",
            "only_letters_numbers_1_and_underscores_",
            "text contains braces but never closes them properly { something here",
            "text contains closing brace only } but never an opening one",
            "text contains percent signs % but no valid reference structure",
            "text contains dollar sign but no brace after $ like $value or $$value",
            "text contains at sign but no braces after it like @value or @ limit",
            "very close to direct ref but is wrong #ABC12.(response).status",
            "very close to direct ref but misses parentheses #ABC123.response.status here",
            "very close to direct ref but ends early #ABC123.(response) nothing more",
            "text contains enhancement like pattern but wrong length #{%1234567890%}",
            "text contains enhancement like pattern but wrong chars #{%ZZZZZZZZZZZZZZZZZZZZZZZZ%}",
            "text contains request data exclusion start {%something long inside here}",
            "text contains request data exclusion end {something long inside here%}",
            "text contains mixed symbols $ @ # % but never forms a valid reference",
            "long expression with many characters and symbols !@#$%^&*() but still no reference"
    })
    void returnFalseWhenNoReferencePresent(String expression) {
        assertFalse(detected(expression));
    }
}
