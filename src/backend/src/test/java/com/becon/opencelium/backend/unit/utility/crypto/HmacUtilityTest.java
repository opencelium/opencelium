package com.becon.opencelium.backend.unit.utility.crypto;

import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link HmacUtility}.
 *
 * No Spring context is loaded.
 *
 * The utility clas has a static secret key internally, thus the generated
 * hashes are deterministic and safe to assert directly.
 */
@DisplayName("HmacUtility — unit")
class HmacUtilityTest {

    // ── encode(String) ────────────────────────────────────────────────────────

    @Test
    void encodeReturnsNonBlankHashWhenInputValid() {
        String result = HmacUtility.encode("licenseId-extraData");

        assertThat(result).isNotBlank();
    }

    @Test
    void encodeReturnsSameHashWhenInputIsSame() {
        String first = HmacUtility.encode("licenseId-extraData");
        String second = HmacUtility.encode("licenseId-extraData");

        assertThat(first).isEqualTo(second);
    }

    @Test
    void encodeReturnsDifferentHashWhenInputDiffers() {
        String first = HmacUtility.encode("licenseId-extraData-1");
        String second = HmacUtility.encode("licenseId-extraData-2");

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    void encodeThrowsRuntimeExceptionWhenInputNull() {
        assertThatThrownBy(() -> HmacUtility.encode((String) null))
                .isInstanceOf(RuntimeException.class);
    }

    // ── encode(byte[]) ────────────────────────────────────────────────────────

    @Test
    void encodeReturnsNonBlankHashWhenByteArrayNull() {
        String result = HmacUtility.encode((byte[]) null);

        assertThat(result).isNotBlank();
    }

    @Test
    void encodeReturnsHashWhenByteArrayValid() {
        byte[] bytes = "invoker-file".getBytes();
        String result = HmacUtility.encode(bytes);

        assertThat(result).isNotBlank();
    }

    @Test
    void encodeReturnsSameHashWhenByteArrayIsSame() {
        byte[] payload = "invoker-file".getBytes();

        String first = HmacUtility.encode(payload);
        String second = HmacUtility.encode(payload);

        assertThat(first).isEqualTo(second);
    }

    @Test
    void encodeReturnsDifferentHashWhenByteArrayDiffers() {
        String first = HmacUtility.encode("invoker-file-1".getBytes());
        String second = HmacUtility.encode("invoker-file-2".getBytes());

        assertThat(first).isNotEqualTo(second);
    }

    // ── verify(String, String) ────────────────────────────────────────────────

    @Test
    void verifyReturnsTrueWhenHmacMatches() {
        String data = "licenseId-extraData";
        String hmac = HmacUtility.encode(data);

        boolean result = HmacUtility.verify(data, hmac);

        assertThat(result).isTrue();
    }

    @Test
    void verifyReturnsFalseWhenHmacDoesNotMatch() {
        boolean result = HmacUtility.verify("licenseId-extraData", "invalid-hmac");

        assertThat(result).isFalse();
    }

    @Test
    void verifyThrowsRuntimeExceptionWhenHmacNull() {
        assertThatThrownBy(() -> HmacUtility.verify("licenseId-extraData", null))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void verifyThrowsRuntimeExceptionWhenDataNull() {
        String data = "licenseId-extraData";
        String hmac = HmacUtility.encode(data);

        assertThatThrownBy(() -> HmacUtility.verify((String) null, hmac))
                .isInstanceOf(RuntimeException.class);
    }

    // ── verify(HmacValidator, String) ─────────────────────────────────────────

    @Test
    void verifyReturnsTrueWhenValidatorVerifiesHmac() {
        HmacValidator validator = mock(HmacValidator.class);

        when(validator.verify("valid-hmac")).thenReturn(true);

        boolean result = HmacUtility.verify(validator, "valid-hmac");

        assertThat(result).isTrue();
        verify(validator).verify("valid-hmac");
    }

    @Test
    void verifyReturnsFalseWhenValidatorRejectsHmac() {
        HmacValidator validator = mock(HmacValidator.class);

        when(validator.verify("invalid-hmac")).thenReturn(false);

        boolean result = HmacUtility.verify(validator, "invalid-hmac");

        assertThat(result).isFalse();
        verify(validator).verify("invalid-hmac");
    }
}
