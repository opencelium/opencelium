package com.becon.opencelium.backend.reference.utility;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class ReferenceUtilityTest {
    @ParameterizedTest
    @CsvSource({
            "for {%#ababab.(response).body.$.path.to.arr[*]%}, direct ref({%#ababab.(response).body.$.path.to.arr[*]%})",
            "forin {%#ababab.(response).body.$.field1.['field2_with_special_symbol'].field3%}, direct ref({%#ababab.(response).body.$.field1.['field2_with_special_symbol'].field3%})",
            "${key:type} SplitString ';', webhook(${key:type})",
            "forin ${key.field[*]}, webhook(${key.field[*]})",
            "{%#ababab.(response).body.$.path.to.str%} SplitString ';', direct ref({%#ababab.(response).body.$.path.to.str%})",
            "for #{%a1b2c3d4e5f6a7b8c9d0e1f2%}, enhancement(#{%a1b2c3d4e5f6a7b8c9d0e1f2%})",
            "@{limit} SplitString ';', page(@{limit})",
            "@{size} SplitString ';', page(@{size})",
            "for {key}, request data({key})",
            "{#ctorId.key} SplitString ';', request data({#ctorId.key})",
    })
    void getReferenceTypeTest(String expression, String expectedType) {
        String evaluatedType = ReferenceUtility.getContainedReferenceAndType(expression);

        // assert creation
        assertEquals(evaluatedType, expectedType);
    }
}
