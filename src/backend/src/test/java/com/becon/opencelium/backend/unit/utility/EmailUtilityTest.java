package com.becon.opencelium.backend.unit.utility;

import com.becon.opencelium.backend.utility.EmailUtility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link EmailUtility}.
 * <p>
 * No Spring context is loaded. No dependency is required to set up test class.
 * Run with: ./gradlew test
 */
@DisplayName("EmailUtility — unit")
class EmailUtilityTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "user@example.com",
            "user.name@example.com",
            "user-name@example.com",
            "user_name@example.com",
            "user+tag@example.com",
            "user&tag@example.com",
            "user123@example.co.uk",
            "USER@EXAMPLE.COM",
            "user@sub.example.com"
    })
    void isValidReturnsTrueForValidEmail(String email) {
        assertTrue(EmailUtility.isValid(email));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            " ",
            "username",
            "@example.com",
            "user@",
            "user@example",
            "user@.com",
            ".user@example.com",
            "user.@example.com",
            "user..name@example.com",
            "user@example..com",
            "user name@example.com",
            "user@example.com.",
            "user@example.c",
            "user@example.abcdefgh"
    })
    void isValidReturnsFalseForInvalidEmail(String email) {
        assertFalse(EmailUtility.isValid(email));
    }
}
