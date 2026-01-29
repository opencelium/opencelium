package com.becon.opencelium.backend.reference;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReferenceMatchersTest {

    // -------  isDirect  -------

    @ParameterizedTest
    @CsvSource({
            "#ababab.(response).[*], true",
            "#aba213.(response).[*].status, true",
            "#123bab.(response).[*].header, true",
            "#aba312.(response).[*].body, true",
            "#ab123b.(response).status, true",
            "#a4346b.(response).header.$.Content-Type, true",
            "#a543ab.(request).header.$.Content-Type, true",
            "#a43bab.(response).body.$.field[*], true",
            "#ab634b.(request).body.$.field[*], true",
            "#346bab.(response).body.$.field1.['field2_with_special_symbol'].field3, true",
            "#456536.(response).body.$.[*], true",
            "#a5464b.(request).body.$.[*], true",

            "@ababab.(response).[*], false",
            "#ababab(response).[*], false",
            "#ababab.(response), false",
            "#ababab.(response)., false",
            "#a, false",
            ", false"
    })
    void isDirect(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isDirect(text));
    }


    // -------  isWrappedDirect -------

    @ParameterizedTest
    @CsvSource({
            "{%#ababab.(response).[*]%}, true",

            "{#ababab.(response).[*]}, false",
            "{%#ababab.(response).[*]}, false",
            "{%#ababab.(response).[*]%, false",
            "#ababab.(response).[*], false",
            ", false"
    })
    void isWrappedDirect(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isWrappedDirect(text));
    }


    // -------  isEnhancement -------

    @ParameterizedTest
    @CsvSource({
            "#{%0123456789abcdef01234567%}, true",

            "#{%0123%}, false",
            "#{0123456789abcdef01234567}, false",
            "#{%0123456789abcdef0123456X%}, false",
            "#{%0123456789abcdef01234567}, false",
            ", false"
    })
    void isEnhancement(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isEnhancement(text));
    }


    // -------  isWebhook -------

    @ParameterizedTest
    @CsvSource({
            "${key}, true",
            "${key.field[0]:integer}, true",

            "${}, true",
            "$key}, false",
            "{key}, false",
            "@{key}, false",
            ", false"
    })
    void isWebhook(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isWebhook(text));
    }


    // -------  isPage -------

    @ParameterizedTest
    @CsvSource({
            "@{x}, true",
            "@{page.id}, true",

            "@x, false",
            "{x}, false",
            "@{x, false",
            "${x}, false",
            ", false"
    })
    void isPage(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isPage(text));
    }


    // -------  isRequestData -------

    @ParameterizedTest
    @CsvSource({
            "{id}, true",
            "{data.value}, true",

            "{}, true",
            "{, false",
            "${id}, false",
            "@{id}, false",
            ", false"
    })
    void isRequestData(String text, boolean expected) {
        assertEquals(expected, ReferenceMatchers.isRequestData(text));
    }
}
