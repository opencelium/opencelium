package com.becon.opencelium.backend.utility.crypto;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.util.AssertionErrors.assertEquals;
import static org.springframework.test.util.AssertionErrors.assertNotEquals;

class HmacUtilityTest {
    @Test
    void testHmacConsistencyAndSensitivityForString() {
        // Same content → should produce same HMAC
        String xmlString1 = "<root><field>1</field></root>";
        String xmlString2 = "<root><field>1</field></root>";

        String hmac1 = HmacUtility.encode(xmlString1);
        String hmac2 = HmacUtility.encode(xmlString2);

        assertEquals("HMACs should be the same for identical input", hmac1, hmac2);

        // Different content → should produce different HMAC
        String xmlString3 = "<root><field>2</field></root>";
        String hmac3 = HmacUtility.encode(xmlString3);

        assertNotEquals("HMACs should differ for different input", hmac1, hmac3);
    }

    @Test
    void testHmacConsistencyAndSensitivityForByteArray() {
        // Same content → should produce same HMAC
        byte[] xmlBytes1 = "<root><field>1</field></root>".getBytes(StandardCharsets.UTF_8);
        byte[] xmlBytes2 = "<root><field>1</field></root>".getBytes(StandardCharsets.UTF_8);

        String hmac1 = HmacUtility.encode(xmlBytes1);
        String hmac2 = HmacUtility.encode(xmlBytes2);

        assertEquals("HMACs should be the same for identical input", hmac1, hmac2);

        // Different content → should produce different HMAC
        byte[] xmlBytes3 = "<root><field>2</field></root>".getBytes(StandardCharsets.UTF_8);
        String hmac3 = HmacUtility.encode(xmlBytes3);

        assertNotEquals("HMACs should differ for different input", hmac1, hmac3);
    }
}