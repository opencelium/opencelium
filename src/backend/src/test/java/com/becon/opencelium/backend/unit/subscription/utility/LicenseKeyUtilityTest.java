package com.becon.opencelium.backend.unit.subscription.utility;

import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.subscription.utility.MonthPeriod;
import com.becon.opencelium.backend.testutil.fixture.LicenseKeyFixture;
import com.becon.opencelium.backend.utility.crypto.CryptoUtil;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.MockedStatic;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link LicenseKeyUtility}.
 * <p>
 * CryptoUtil is mocked intentionally. Real crypto behaviour is already covered
 * in CryptoUtilTest.
 * <p>
 * No Spring context is loaded. No dependency is required to set up test class.
 * Run with: ./gradlew test
 */
@DisplayName("LicenseKeyUtility — unit")
class LicenseKeyUtilityTest {
    private final String ENCRYPTED_LICENCE_PLACEHOLDER = "encrypted-licence";

    // ── verify(String, HmacValidator) ────────────────────────────────────────

    @ParameterizedTest
    @NullAndEmptySource
    void verifyReturnsFalseWhenLicenseKeyNullOrEmpty(String licenseKey) {
        HmacValidator validator = mock(HmacValidator.class);

        boolean result = LicenseKeyUtility.verify(licenseKey, validator);

        assertThat(result).isFalse();
    }

    @Test
    void verifyReturnsTrueWhenLicenseKeyValid() {
        try (MockedStatic<LicenseKeyUtility> mocked = mockStatic(LicenseKeyUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            LicenseKey licenseKey = LicenseKeyFixture.aValidLicenseKey();

            mocked.when(() -> LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .thenReturn(licenseKey);

            HmacValidator validator = mock(HmacValidator.class);

            when(validator.verify(licenseKey.getHmac()))
                    .thenReturn(true);

            // WHEN
            boolean result = LicenseKeyUtility.verify(ENCRYPTED_LICENCE_PLACEHOLDER, validator);

            // THEN
            assertThat(result).isTrue();
        }
    }

    @Test
    void verifyReturnsFalseWhenHmacValidationFails() {
        try (MockedStatic<LicenseKeyUtility> mocked = mockStatic(LicenseKeyUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            LicenseKey licenseKey = LicenseKeyFixture.aValidLicenseKey();

            mocked.when(() -> LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .thenReturn(licenseKey);

            HmacValidator validator = mock(HmacValidator.class);

            when(validator.verify(licenseKey.getHmac()))
                    .thenReturn(false);

            // WHEN
            boolean result = LicenseKeyUtility.verify(ENCRYPTED_LICENCE_PLACEHOLDER, validator);

            // THEN
            assertThat(result).isFalse();
        }
    }

    @Test
    void verifyThrowsRuntimeExceptionWhenStartDateIsInFuture() {
        try (MockedStatic<LicenseKeyUtility> mocked = mockStatic(LicenseKeyUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            LicenseKey licenseKey = LicenseKeyFixture.aLicenseKeyWithFutureStartDate();

            mocked.when(() -> LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .thenReturn(licenseKey);

            HmacValidator validator = mock(HmacValidator.class);

            when(validator.verify(licenseKey.getHmac()))
                    .thenReturn(true);

            // WHEN-THEN
            assertThatThrownBy(() ->
                    LicenseKeyUtility.verify(ENCRYPTED_LICENCE_PLACEHOLDER, validator))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Subscription will start at");
        }
    }

    @Test
    void verifyThrowsRuntimeExceptionWhenLicenseKeyExpired() {
        try (MockedStatic<LicenseKeyUtility> mocked = mockStatic(LicenseKeyUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            LicenseKey licenseKey = LicenseKeyFixture.anExpiredLicenseKey();

            mocked.when(() -> LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .thenReturn(licenseKey);

            HmacValidator validator = mock(HmacValidator.class);

            when(validator.verify(licenseKey.getHmac()))
                    .thenReturn(true);

            // WHEN-THEN
            assertThatThrownBy(() ->
                    LicenseKeyUtility.verify(ENCRYPTED_LICENCE_PLACEHOLDER, validator))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("expired");
        }
    }

    // ── verify(LicenseKey, HmacValidator) ────────────────────────────────────

    @Test
    void verifyReturnsTrueWhenLicenseObjectValid() {
        // GIVEN
        LicenseKey licenseKey = LicenseKeyFixture.aValidLicenseKey();

        HmacValidator validator = mock(HmacValidator.class);

        when(validator.verify(licenseKey.getHmac()))
                .thenReturn(true);

        // WHEN
        boolean result = LicenseKeyUtility.verify(licenseKey, validator);

        // THEN
        assertThat(result).isTrue();
    }

    @Test
    void verifyReturnsFalseWhenLicenseObjectHmacInvalid() {
        // GIVEN
        LicenseKey licenseKey = LicenseKeyFixture.aValidLicenseKey();

        HmacValidator validator = mock(HmacValidator.class);

        when(validator.verify(licenseKey.getHmac()))
                .thenReturn(false);

        // WHEN
        boolean result = LicenseKeyUtility.verify(licenseKey, validator);

        // THEN
        assertThat(result).isFalse();
    }

    // ── decrypt ──────────────────────────────────────────────────────────────

    @ParameterizedTest
    @NullAndEmptySource
    void decryptReturnsNullWhenEncryptedLicenseNullOrEmpty(String encryptedLicense) {
        // WHEN
        LicenseKey result = LicenseKeyUtility.decrypt(encryptedLicense);

        // THEN
        assertThat(result).isNull();
    }

    @Test
    void decryptReturnsLicenseKeyWhenPayloadValid() {
        try (MockedStatic<CryptoUtil> mocked = mockStatic(CryptoUtil.class)) {
            // GIVEN
            String json = LicenseKeyFixture.aValidLicenseKeyJson();

            mocked.when(() -> CryptoUtil.decrypt(anyString(), anyString()))
                    .thenReturn(json.getBytes(StandardCharsets.UTF_8));

            // WHEN
            LicenseKey result = LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER);

            // THEN
            assertThat(result).isNotNull();
            assertThat(result.getHmac()).isEqualTo("valid-hmac");
            assertThat(result.getStartDate()).isEqualTo(1000);
            assertThat(result.getEndDate()).isEqualTo(9999999999999L);
        }
    }

    @Test
    void decryptThrowsRuntimeExceptionWhenPayloadMalformed() {
        try (MockedStatic<CryptoUtil> mocked = mockStatic(CryptoUtil.class)) {
            // GIVEN
            mocked.when(() -> CryptoUtil.decrypt(anyString(), anyString()))
                    .thenReturn("not-json".getBytes(StandardCharsets.UTF_8));

            // WHEN-THEN
            assertThatThrownBy(() ->
                    LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Test
    void decryptThrowsRuntimeExceptionWhenCryptoFails() {
        try (MockedStatic<CryptoUtil> mocked = mockStatic(CryptoUtil.class)) {
            // GIVEN
            String exceptionMessage = "crypto-failure";

            mocked.when(() -> CryptoUtil.decrypt(anyString(), anyString()))
                    .thenThrow(new RuntimeException(exceptionMessage));

            // WHEN-THEN
            assertThatThrownBy(() ->
                    LicenseKeyUtility.decrypt(ENCRYPTED_LICENCE_PLACEHOLDER))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining(exceptionMessage);
        }
    }

    // ── getCurrentMonthPeriod ────────────────────────────────────────────────

    @Test
    void getCurrentMonthPeriodReturnsValidMonthlyRange() {
        // GIVEN
        long initialDate = Instant.now()
                .minusSeconds(86400)
                .toEpochMilli();

        // WHEN
        MonthPeriod result = LicenseKeyUtility.getCurrentMonthPeriod(initialDate);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getStartDate())
                .isLessThan(result.getEndDate());
    }

    // ── readFreeLicense ──────────────────────────────────────────────────────

    @Test
    void readFreeLicenseReturnsConfiguredLicense() {
        // WHEN
        String result = LicenseKeyUtility.readFreeLicense();

        // THEN
        assertThat(result).isNotBlank();
    }
}
