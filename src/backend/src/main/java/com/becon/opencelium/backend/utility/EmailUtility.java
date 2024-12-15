package com.becon.opencelium.backend.utility;

import java.util.regex.Pattern;

public class EmailUtility {
    private static final Pattern pattern = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    public static boolean isEmail(String email) {
        if (email == null) {
            return false;
        }

        return pattern.matcher(email).matches();
    }
}
