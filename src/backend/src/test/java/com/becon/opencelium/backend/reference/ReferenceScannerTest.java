package com.becon.opencelium.backend.reference;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReferenceScannerTest {
    /*
     * Test-only delegate for ReferenceScanner.extract(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static List<String> extract(String expression) {
        return ReferenceScanner.extract(expression);
    }


    @Test
    void emptyListForNull() {
        assertTrue(extract(null).isEmpty());
    }

    @Test
    void emptyListForBlankString() {
        assertTrue(extract("\t\n ").isEmpty());
    }

    @Test
    void extractWrappedDirectReference() {
        String expr = "value = {%#ababab.(response).body.$.[*]%}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("{%#ababab.(response).body.$.[*]%}", refs.get(0));
    }

    @Test
    void extractEnhancement() {
        String expr = "bindId = #{%abcdef0123456789abcdef01%}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("#{%abcdef0123456789abcdef01%}", refs.get(0));
    }

    @Test
    void doesNotExtractIfInvalidLengthForEnhancement() {
        String expr = "#{%abc%}";

        List<String> refs = extract(expr);

        assertTrue(refs.isEmpty());
    }

    @Test
    void extractWebhookWithKey() {
        String expr = "send to ${key}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("${key}", refs.get(0));
    }

    @Test
    void extractWebhookWithKeyAndType() {
        String expr = "send ${key.field[*]:type}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("${key.field[*]:type}", refs.get(0));
    }

    @Test
    void extractPageReference() {
        String expr = "limit = @{limit}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("@{limit}", refs.get(0));
    }

    @Test
    void extractRequestDataWithKey() {
        String expr = "value = {key}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("{key}", refs.get(0));
    }

    @Test
    void extractRequestDataWithCtorIdAndKey() {
        String expr = "value = {#12.field}";

        List<String> refs = extract(expr);

        assertEquals(1, refs.size());
        assertEquals("{#12.field}", refs.get(0));
    }

    @Test
    void doesNotExtractIfRequestDataLooksLikeEnhancementSyntax() {
        String expr = "{%notRequestData%}";

        List<String> refs = extract(expr);

        assertTrue(refs.isEmpty());
    }

    @Test
    void extractMultipleDifferentReferences() {
        int t = 1000;

        String enhancement = "#{%abcdef0123456789abcdef01%}";
        String webhook = "${key:type}";
        String pageRef = "@{size}";
        String requestData = "{#3.value}";
        String wrappedDirectRef = "{%#ababab.(request).body.$.field[*]%}";

        List<String> base = new ArrayList<>();
        base.add(enhancement);
        base.add(webhook);
        base.add(pageRef);
        base.add(requestData);
        base.add(wrappedDirectRef);

        // add spacing noise
        for (int i = 0; i < 8; i++) {
            base.add(" ");
        }

        while (t-- > 0) {
            Collections.shuffle(base);

            String expr = String.join("", base);

            List<String> refs = extract(expr);

            assertEquals(5, refs.size());

            assertTrue(refs.contains(enhancement));
            assertTrue(refs.contains(webhook));
            assertTrue(refs.contains(pageRef));
            assertTrue(refs.contains(requestData));
            assertTrue(refs.contains(wrappedDirectRef));
        }
    }

    @Test
    void extractDuplicateReferences() {
        String expr = "{key} and {key}";

        List<String> refs = extract(expr);

        assertEquals(2, refs.size());
        assertEquals("{key}", refs.get(0));
        assertEquals("{key}", refs.get(1));
    }
}
