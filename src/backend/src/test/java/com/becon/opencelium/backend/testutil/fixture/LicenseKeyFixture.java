package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.subscription.dto.LicenseKey;

/**
 * Object mother for {@link LicenseKey} test data.
 *
 * Use named factory methods instead of constructing LicenseKey inline.
 */
public final class LicenseKeyFixture {

    private LicenseKeyFixture() {
    }

    public static LicenseKey aValidLicenseKey() {
        LicenseKey licenseKey = new LicenseKey();

        licenseKey.setHmac("valid-hmac");
        licenseKey.setStartDate(System.currentTimeMillis() - 86400000);
        licenseKey.setEndDate(System.currentTimeMillis() + 86400000);

        return licenseKey;
    }

    public static LicenseKey aLicenseKeyWithFutureStartDate() {
        LicenseKey licenseKey = aValidLicenseKey();

        licenseKey.setStartDate(System.currentTimeMillis() + 86400000);

        return licenseKey;
    }

    public static LicenseKey anExpiredLicenseKey() {
        LicenseKey licenseKey = aValidLicenseKey();

        licenseKey.setEndDate(System.currentTimeMillis() - 86400000);

        return licenseKey;
    }

    public static String aValidLicenseKeyJson() {
        return """
                {
                  "hmac":"valid-hmac",
                  "startDate":1000,
                  "endDate":9999999999999
                }
                """;
    }
}
