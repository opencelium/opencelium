package com.becon.opencelium.backend.utility;

import java.util.regex.Pattern;

public final class EmailUtility {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    private EmailUtility() {
    }

    public static boolean isValid(String email) {
        if (email == null) {
            return false;
        }

        return EMAIL_PATTERN.matcher(email).matches();
    }
}
