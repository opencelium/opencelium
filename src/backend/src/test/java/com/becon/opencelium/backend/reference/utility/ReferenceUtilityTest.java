package com.becon.opencelium.backend.reference.utility;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReferenceUtilityTest {
    @ParameterizedTest
    @CsvSource({
            "for {%#ababab.(response).body.$.path.to.arr[*]%}, WRAPPED_DIRECT ref({%#ababab.(response).body.$.path.to.arr[*]%})",
            "forin {%#ababab.(response).body.$.field1.['field2_with_special_symbol'].field3%}, WRAPPED_DIRECT ref({%#ababab.(response).body.$.field1.['field2_with_special_symbol'].field3%})",
            "${key:integer} SplitString ';', WEBHOOK ref(${key:integer})",
            "forin ${key.field[*]}, WEBHOOK ref(${key.field[*]})",
            "{%#ababab.(response).body.$.path.to.str%} SplitString ';', WRAPPED_DIRECT ref({%#ababab.(response).body.$.path.to.str%})",
            "for #{%a1b2c3d4e5f6a7b8c9d0e1f2%}, ENHANCEMENT ref(#{%a1b2c3d4e5f6a7b8c9d0e1f2%})",
            "@{limit} SplitString ';', PAGE ref(@{limit})",
            "@{size} SplitString ';', PAGE ref(@{size})",
            "for {key}, REQUEST_DATA ref({key})",
            "{#12.key} SplitString ';', REQUEST_DATA ref({#12.key})",
    })
    void getReferenceTypeTest(String expression, String expectedType) {
        String evaluatedType = ReferenceUtility.getContainedReferenceAndType(expression);

        // assert creation
        assertEquals(expectedType, evaluatedType);
    }
}
